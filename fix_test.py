import subprocess
try:
    print(subprocess.check_output("npm run test --prefix frontend", shell=True).decode())
except subprocess.CalledProcessError as e:
    print(e.output.decode())
