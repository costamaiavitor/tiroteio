import glob, sys
from PIL import Image, ImageDraw
pfx=sys.argv[1]; fs=sorted(glob.glob(f'renders/seq_{pfx}_*.png'))
S=Image.new('RGB',(5*288,((len(fs)+4)//5)*162))
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize((288,162)); ImageDraw.Draw(im).text((4,3),f[-8:-4],fill=(255,255,0)); S.paste(im,((i%5)*288,(i//5)*162))
S.save(f'renders/seq_{pfx}.png'); print('ok')
