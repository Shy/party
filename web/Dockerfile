#Use the python 3 base image.
FROM python:3-slim

#Expose ports
EXPOSE 5000

# Setup work directory.
WORKDIR /python-docker

# Copy the requirements file to the container and the install depenedencies.
COPY requirements.txt /python-docker

RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install -r requirements.txt

# set environment variables\
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY . /python-docker


