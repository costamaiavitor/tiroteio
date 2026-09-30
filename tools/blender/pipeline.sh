# Refaz assets/arms.glb do zero com o Blender em segundo plano (sem janela).
# Precisa de: Blender 5.x com o MPFB instalado, e as facas do jogo exportadas em assets/karambit.glb e assets/knife.glb.
set -e
cd "$(dirname "$0")"
B="${BLENDER:-/c/Program Files/Blender Foundation/Blender 5.2/blender.exe}"
echo "SAVE_AS='base.blend'" > sv_base.py; echo "SAVE_AS='arms.blend'" > sv_arms.py
"$B" -b --python run.py -- build_arms.py lib.py+setup_cam.py import_knives.py subdiv.py sv_base.py+save.py
"$B" -b base.blend --python run.py -- lib.py+th1.py+hp.py+kp.py+kmoves.py+anim2.py textures.py export.py sv_arms.py+save.py
