# eos-voter
Simple browser tool for voting in EOS

# Run (dev)
```
npm i
npm start
```

# Docker
```
docker build -t eos-voter .
docker run -p 8080:8080 -v $PWD/nginx.conf:/etc/nginx/nginx.conf:ro -d eos-voter
```
