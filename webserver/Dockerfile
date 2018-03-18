FROM python:3.6-stretch

RUN apt-get update && apt-get install -y \
    libsqlite3-dev \
    nano \
    sqlite3

ADD requirements.txt /tmp
RUN pip install -r /tmp/requirements.txt && pip install gunicorn

ADD . /app
WORKDIR /app

RUN cd static/images/maps/ && ([ -e maps.json ] || mv maps.json.base maps.json)
CMD ["/bin/bash", "-c", "gunicorn --bind=0.0.0.0:8000 main:app"]
#CMD ["/bin/bash", "-c", "tail -f /dev/null"]