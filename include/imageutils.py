from PIL import Image, ImageOps, ImageEnhance
import aiofiles
import aiohttp
import numpy as np
import cv2

class Colours:
    RED = (254, 0, 2)
    YELLOW = (255, 255, 15)
    BLUE = (36, 113, 229)
    WHITE = (255,) * 3

def invert(imgname,newimgname):
    image = Image.open(imgname)
    if image.mode == 'RGBA':
        r,g,b,a = image.split()
        rgb_image = Image.merge('RGB', (r,g,b))
        inverted_image = ImageOps.invert(rgb_image)
        r2,g2,b2 = inverted_image.split()
        final_transparent_image = Image.merge('RGBA', (r2,g2,b2,a))
        final_transparent_image.save(newimgname)

    else:
        inverted_image = ImageOps.invert(image)
        inverted_image.save(newimgname)

async def downloadimg(imgurl,imgname):
    async with aiohttp.ClientSession() as session:
        async with session.get(imgurl) as resp:
            if resp.status == 200:
                f = await aiofiles.open(imgname, mode='wb')
                await f.write(await resp.read())
                await f.close()

def deepfry(imgname,newimgname):
    eye_cascade = cv2.CascadeClassifier('/bots/sacarver/include/haarcascade_eye.xml')
    eyes = eye_cascade.detectMultiScale(roi_gray)

    img = Image.open(imgname)
    img = img.convert('RGB')
    eyepos = []
    eyesizes = []
    for (ex,ey,ew,eh) in eyes:
        xpos = (ex + (ew/2))
        ypos = (ey + (eh/2))
        eyepos.append([xpos,ypos])
        eyesizes.append(ew)
    eye1 = eyepos[0]
    eye2 = eyepos[1]
    eye1size = eyesizes[0] *4
    eye2size = eyesizes[1] *4
    eye1corner = tuple(math.floor(x - eye1size / 2.5 + 5) for x in eye1)
    eye2corner = tuple(math.floor(x - eye2size / 2.5 + 5) for x in eye2)
    flare = Image.open('/bots/sacarver/include/flare.png')
    flare1 = flare.copy().resize((eye1size,) * 2, resample=Image.BILINEAR)
    flare2 = flare.copy().resize((eye2size) * 2, resample=Image.BILINEAR)
    del flare

    width, height = img.width, img.height
    img = img.resize((int(width ** .75), int(height ** .75)), resample=Image.LANCZOS)
    img = img.resize((int(width ** .88), int(height ** .88)), resample=Image.BILINEAR)
    img = img.resize((int(width ** .9), int(height ** .9)), resample=Image.BICUBIC)
    img = img.resize((width, height), resample=Image.BICUBIC)
    img = ImageOps.posterize(img, 4)
    r = img.split()[0]
    r = ImageEnhance.Contrast(r).enhance(2.0)
    r = ImageEnhance.Brightness(r).enhance(1.5)
    r = ImageOps.colorize(r, Colours.RED, Colours.YELLOW)
    img = Image.blend(img, r, 0.75)
    img = ImageEnhance.Sharpness(img).enhance(100.0)

    img.paste(flare1, eye1corner, flare1)
    img.paste(flare2, eye2corner, flare2)
    img.save(newimgname)
