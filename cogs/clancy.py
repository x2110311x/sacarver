
import yaml
import discord
import math
import cv2
from mtcnn import MTCNN
import numpy as np
from PIL import Image
from PIL import ImageDraw
import numpy
from blend_modes import multiply
import io
import requests
from discord.ext import commands
from os.path import abspath
from include import DB

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

class SaidNoError(Exception):
    pass

detector = MTCNN()

class SAI(commands.Cog, name="Clancy Era Commands"):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        self.DBConn = await DB.connect()

    '''@commands.command()
    async def saipfp(self, ctx):
        if len(ctx.message.attachments) > 0:
            sai = Image.open(abspath("./include/images/sai.png")).convert("RGBA")
            mask = Image.open(abspath("./include/images/saimask.png")).resize(sai.size).convert('L')
            pink = Image.new("RGB", (512,512), 11172592).convert("RGBA")
            received = requests.get(ctx.message.attachments[0].url)
            try:
                receivedImage = Image.open(io.BytesIO(received.content)).convert('L').convert("RGBA")
                receivedImage.thumbnail((512, 512), Image.ANTIALIAS)
                if receivedImage.size[0] < 512:
                    x = 512
                    y = int(receivedImage.size[1]/receivedImage.size[0] * x)
                if receivedImage.size[1] < 512:
                    y = 512
                    x = int(receivedImage.size[0]/receivedImage.size[1] * y)
                else:
                    x = 512
                    y = 512
                receivedImage = receivedImage.resize((x, y), Image.ANTIALIAS)
                if receivedImage.size[0] > 512:
                    excess = math.ceil((receivedImage.size[0] - 512)/2)
                    receivedImage = receivedImage.crop((excess, 0, receivedImage.size[0] - excess, receivedImage.size[1]))
                if receivedImage.size[1] > 512:
                    excess = math.ceil((receivedImage.size[1] - 512)/2)
                    receivedImage = receivedImage.crop((0, excess, receivedImage.size[0], receivedImage.size[1] - excess))
                receivedImage = receivedImage.resize((512, 512), Image.ANTIALIAS)
                background_img = numpy.array(receivedImage)
                background_img_float = background_img.astype(float)    
                foreground_img = numpy.array(pink) 
                foreground_img_float = foreground_img.astype(float)  

                final = multiply(background_img_float, foreground_img_float, .95)
                blended_img = numpy.uint8(final)
                blended_img_raw = Image.fromarray(blended_img)
                blended_img_raw.paste(sai, mask)
                imgByteArr = io.BytesIO()
                blended_img_raw.save(imgByteArr, format='PNG')
                imgByteArr.seek(0)
                sendFile = discord.File(fp=imgByteArr, filename="pfp.png")
                await ctx.send(file=sendFile)
            except Exception as e:
                await ctx.send(f"I'm having some trouble generating the image\n```{e}```")
        else:
            await ctx.send("Please send an image!")'''


    @commands.command() 
    async def tapepfp(self, ctx):
        '''
        This section is an adapted blend of some of my old SAI era code 
        as well as the red tape picture generator from
        https://github.com/CamiloArango

        https://github.com/CamiloArango/red
        '''
        if len(ctx.message.attachments) > 0:
            received = requests.get(ctx.message.attachments[0].url)
            try:
                image_stream = Image.open(io.BytesIO(received.content))
                image = np.frombuffer(image_stream.read(), np.uint8)
                image = cv2.imdecode(image, cv2.IMREAD_COLOR)

                # Convert image to RGB (MTCNN works with RGB images)
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

                # Detect faces in the image
                faces = detector.detect_faces(image_rgb)


                # Load the selected tape image
                tape_image_path = abspath("./include/images/tape1.png")
                tape_image = cv2.imread(tape_image_path, cv2.IMREAD_UNCHANGED)

                # Iterate through each face and cover the eyes with tape
                for face in faces:
                    keypoints = face['keypoints']
                    
                    # Get the coordinates of the eyes
                    left_eye_x, left_eye_y = keypoints['left_eye']
                    right_eye_x, right_eye_y = keypoints['right_eye']
                    
                    # Calculate the dimensions and position to place the tape over each eye
                    tape_width = int(np.abs(right_eye_x - left_eye_x) * 3.25)
                    tape_height = int(tape_width * tape_image.shape[0] / tape_image.shape[1])
                    tape_x = int((left_eye_x + right_eye_x) / 2 - tape_width / 2)
                    tape_y = int((left_eye_y + right_eye_y) / 2 - tape_height / 2)
                    
                    # Resize the tape image to fit the dimensions
                    resized_tape = cv2.resize(tape_image, (tape_width, tape_height))
                    
                    # Extract the alpha channel of the tape image
                    tape_alpha = resized_tape[:, :, 3] / 255.0
                    
                    # Overlay the tape image onto the original image
                    for c in range(3):  # Loop over RGB channels
                        image[tape_y:tape_y+tape_height, tape_x:tape_x+tape_width, c] = \
                            (1 - tape_alpha) * image[tape_y:tape_y+tape_height, tape_x:tape_x+tape_width, c] + \
                            tape_alpha * resized_tape[:, :, c]  # No need to multiply by 255

                # Encode the image to JPEG format
                _, img_encoded = cv2.imencode('.jpg', image)

                # Convert to bytes
                img_bytes = img_encoded.tobytes()
                sendFile = discord.File(fp=img_bytes, filename="taped.jpg")
                await ctx.send(file=sendFile)
            except Exception as e:
                await ctx.send("I'm having some trouble generating the image")
                print(type(e))
                print(e)
        else:
            await ctx.send("Please send an image!")


def setup(bot):
    bot.add_cog(SAI(bot))
