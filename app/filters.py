from app import app
import pytz
from datetime import timedelta


@app.template_filter()
def humanize_ts(time, timestamp=False):
    est = pytz.timezone("US/Eastern")
    fmt = f"%A %B %-d at %-I:%M %p"
    return time.astimezone(est).strftime(fmt)


@app.template_filter()
def humanize_cal_date(time, timestamp=False):
    est = pytz.timezone("US/Eastern")
    date_fmt = f"%Y-%m-%d"
    return time.astimezone(est).strftime(date_fmt)


@app.template_filter()
def humanize_cal_time(time, timestamp=False):
    est = pytz.timezone("US/Eastern")
    time_fmt = f"%H:%M"
    return time.astimezone(est).strftime(time_fmt)


@app.template_filter()
def humanize_cal_time_end(time, timestamp=False):
    est = pytz.timezone("US/Eastern")
    time_fmt = f"%H:%M"
    diff = timedelta(hours=4)
    endtime = time + diff
    return endtime.astimezone(est).strftime(time_fmt)


@app.template_filter()
def humanize_cal_date_end(time, timestamp=False):
    est = pytz.timezone("US/Eastern")
    date_fmt = f"%Y-%m-%d"
    diff = timedelta(hours=4)
    endtime = time + diff
    return endtime.astimezone(est).strftime(date_fmt)
