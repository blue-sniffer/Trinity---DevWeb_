#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except Exception as exc:
        print('Django not available in this environment. Install requirements to run/manage the project.')
        raise
    execute_from_command_line(sys.argv)
