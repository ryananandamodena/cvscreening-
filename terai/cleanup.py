import os
import glob

# Find and remove attendance_repository.go
for root, dirs, files in os.walk('backend'):
    for f in files:
        if 'attendance_repository' in f:
            path = os.path.join(root, f)
            print(f"Removing: {path}")
            os.remove(path)

# List backend contents
print("\nBackend directory contents:")
for item in os.listdir('backend'):
    print(f"  {item}")