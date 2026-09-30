# Refaz tudo do zero: braços, câmera/IK, facas, subdivisão, texturas, animações e exportação
set -e
cd "$(dirname "$0")"
python bl.py build_arms.py
python bl.py lib.py setup_cam.py > /dev/null
python bl.py import_knives.py > /dev/null
python bl.py subdiv.py
python bl.py textures.py
python bl.py lib.py th1.py hp.py kp.py anim.py
python bl.py export.py
