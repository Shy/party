from flask_frozen import Freezer
from dotenv import load_dotenv
import os
import requests
from pathlib import Path
import time
from io import BytesIO
from PIL import Image

# Load environment variables from .flaskenv if it exists
if os.path.exists('.flaskenv'):
    load_dotenv('.flaskenv')

from app import app
from app.models import EventAttendeeJunction, Event, Attendee
from datetime import datetime, timedelta
import pytz


freezer = Freezer(app)


def cache_event_images():
    """Download, optimize, and cache event images from Imgur during build"""
    utc = pytz.UTC
    now = datetime.now(utc)
    time_diff = timedelta(days=1)

    # Get active events
    active_events = Event.query.filter(Event.date >= now - time_diff).all()

    # Create images directory in static folder
    images_dir = Path(app.static_folder) / 'images' / 'events'
    images_dir.mkdir(parents=True, exist_ok=True)

    for event in active_events:
        if event.image_id:
            image_path = images_dir / f'{event.image_id}.jpg'

            # Skip if already cached
            if image_path.exists():
                print(f'Image already cached: {event.image_id}.jpg')
                continue

            # Download image from Imgur with retry logic
            imgur_url = f'https://i.imgur.com/{event.image_id}.jpg'
            print(f'Downloading image: {imgur_url}')

            # Add User-Agent and retry with exponential backoff
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }

            for attempt in range(3):
                try:
                    response = requests.get(imgur_url, headers=headers, timeout=15)
                    response.raise_for_status()

                    original_size = len(response.content)

                    # Optimize image with Pillow for better mobile quality
                    img = Image.open(BytesIO(response.content))

                    # Convert to RGB if necessary (for PNG with transparency)
                    if img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', img.size, (0, 0, 0))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                        img = background

                    # Save with high quality (90) for hero images - better for mobile
                    img.save(image_path, 'JPEG', quality=90, optimize=True)

                    optimized_size = image_path.stat().st_size
                    print(f'✓ Cached & optimized image: {event.image_id}.jpg')
                    print(f'  Original: {original_size / 1024:.1f}KB → Optimized: {optimized_size / 1024:.1f}KB (quality=90)')
                    break
                except requests.exceptions.RequestException as e:
                    if attempt < 2:
                        wait_time = (attempt + 1) * 2
                        print(f'  Retry {attempt + 1}/3 after {wait_time}s...')
                        time.sleep(wait_time)
                    else:
                        print(f'✗ Failed to download after 3 attempts: {e}')
                except Exception as e:
                    print(f'✗ Failed to optimize image: {e}')
                    # Fallback: save raw image if optimization fails
                    with open(image_path, 'wb') as f:
                        f.write(response.content)
                    print(f'  Saved unoptimized image: {event.image_id}.jpg ({original_size / 1024:.1f}KB)')
                    break


@freezer.register_generator
def event():
    utc = pytz.UTC
    now = datetime.now(utc)

    # Only generate event pages for upcoming or recent events (within last day)
    time_diff = timedelta(days=1)
    active_events = Event.query.filter(Event.date >= now - time_diff).all()

    for event in active_events:
        print(f"Generating event page for {event.event}")
        yield {"event_public_id": event.public_id}


@freezer.register_generator
def attendee_rsvp():
    utc = pytz.UTC
    now = datetime.now(utc)
    time_diff = timedelta(days=1)

    # Only generate RSVP pages for active events (upcoming or within last day)
    active_events = Event.query.filter(Event.date >= now - time_diff).all()

    for event in active_events:
        print(f"Generating rsvps for {event.event} on {event.date}")
        # Only generate RSVP pages for attendees with invited=True
        rsvps = (
            EventAttendeeJunction.query
            .join(Attendee)
            .filter(EventAttendeeJunction.event_id == event.id)
            .filter(Attendee.invited == True)
            .all()
        )
        for rsvp in rsvps:
            print(f"Making rsvp for {rsvp.attendee.attendee}")
            yield {"event_junction_public_id": rsvp.public_id}


@freezer.register_generator
def not_found_page():
    yield {}


if __name__ == "__main__":
    # Cache images before freezing
    with app.app_context():
        print("Caching event images...")
        cache_event_images()
        print()

    freezer.freeze()
