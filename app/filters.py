from app import app
import pytz


@app.template_filter()
def humanize_ts(time, timestamp=False):
    est = pytz.timezone("US/Eastern")
    fmt = f"%A %B %-d at %-I:%M %p"
    return time.astimezone(est).strftime(fmt)
