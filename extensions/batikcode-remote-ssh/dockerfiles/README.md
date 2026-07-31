## Build Images

```bash
./dockerfiles/build.sh
```

### Debugging Image

### Run Image in Interactive Mode

```bash
docker run -it --rm --name batikcode-remote-ssh-test --publish 2222:2222 --env USER_NAME=batikcoderemotessh --env USER_PASSWORD=batikcoderemotessh --env PASSWORD_ACCESS=true --env SUDO_ACCESS=false --env LOG_STDOUT=true local-ubuntu-bash bash
```

### Test Setup Script

```
/usr/local/bin/start-sshd.sh
```

### Delete Container

```
docker rm -f batikcode-remote-ssh-test
```
