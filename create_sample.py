import zipfile

with zipfile.ZipFile('sample_job.zip', 'w') as zf:
    zf.writestr('main.py', "print('Hello from the Hive Agent!')\nimport time\ntime.sleep(2)\nprint('Finished computing matrix')\n")
