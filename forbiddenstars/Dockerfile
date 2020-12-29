from python:3.9

WORKDIR /app
ENV FLASK_APP="server.py"

ADD requirements.txt requirements.txt
RUN pip install -r requirements.txt
ADD . .


ENTRYPOINT ["python", "-m", "flask", "run", "-p", "8080", "--host=0.0.0.0"]

