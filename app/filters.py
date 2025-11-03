from app import app
import pytz
from datetime import timedelta

# Initialize timezone once at module level instead of in every function call
EST = pytz.timezone("US/Eastern")
EVENT_DURATION = timedelta(hours=4)


@app.template_filter()
def humanize_ts(time, timestamp=False):
    fmt = "%A %B %-d at %-I:%M %p"
    return time.astimezone(EST).strftime(fmt)


@app.template_filter()
def humanize_cal_date(time, timestamp=False):
    date_fmt = "%Y-%m-%d"
    return time.astimezone(EST).strftime(date_fmt)


@app.template_filter()
def humanize_cal_time(time, timestamp=False):
    time_fmt = "%H:%M"
    return time.astimezone(EST).strftime(time_fmt)


@app.template_filter()
def humanize_cal_time_end(time, timestamp=False):
    time_fmt = "%H:%M"
    endtime = time + EVENT_DURATION
    return endtime.astimezone(EST).strftime(time_fmt)


@app.template_filter()
def humanize_cal_date_end(time, timestamp=False):
    date_fmt = "%Y-%m-%d"
    endtime = time + EVENT_DURATION
    return endtime.astimezone(EST).strftime(date_fmt)
