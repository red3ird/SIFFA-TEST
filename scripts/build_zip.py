import os
import zipfile
import sys

def build_zip():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    public_dir = os.path.join(project_root, 'public')
    os.makedirs(public_dir, exist_ok=True)
    zip_path = os.path.join(public_dir, 'siffa-proyecto.zip')

    exclude_dirs = {'node_modules', '.git', '.aistudio', '__pycache__', 'dist', '.cache'}
    exclude_files = {'siffa-proyecto.zip'}

    total_files = 0
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_root):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files or file.endswith('.zip') or file.endswith('.pyc'):
                    continue
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, project_root)
                zipf.write(filepath, arcname)
                total_files += 1

    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Zip creado exitosamente en {zip_path}: {total_files} archivos ({size_mb:.2f} MB)")
    return zip_path

if __name__ == '__main__':
    build_zip()
