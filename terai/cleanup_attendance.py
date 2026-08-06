import os
import glob

# Remove old attendance.go file
old_file = 'backend/models/attendance.go'
if os.path.exists(old_file):
    os.remove(old_file)
    print(f"Removed {old_file}")

# List remaining files
print("Remaining files in backend/models:")
for f in os.listdir('backend/models'):
    print(f"  {f}")