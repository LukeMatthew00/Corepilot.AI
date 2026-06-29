from PIL import Image

# Open the image
img = Image.open('logo.jpg').convert("RGBA")
datas = img.getdata()

# Make white background transparent
newData = []
for item in datas:
    # If pixel is close to white, make it transparent
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)

# Find bounding box of all non-transparent pixels
bbox = img.getbbox()
if bbox:
    cropped = img.crop(bbox)
    
    # We want to separate the top logo (L J) from the bottom text (COREPILOT.AI)
    # Let's scan rows from top to bottom to find the empty gap
    width, height = cropped.size
    
    empty_rows = []
    for y in range(height):
        row_empty = True
        for x in range(width):
            if cropped.getpixel((x, y))[3] > 0:
                row_empty = False
                break
        if row_empty:
            empty_rows.append(y)
            
    # Find the largest continuous gap of empty rows which likely separates the logo and text
    if empty_rows:
        gap_start = -1
        gap_end = -1
        # Start looking from at least 30% down the image to avoid gaps in the icon itself
        for y in range(int(height * 0.3), height):
            if y in empty_rows:
                if gap_start == -1:
                    gap_start = y
                gap_end = y
            elif gap_start != -1 and (y - gap_start) > 5:
                # We found a significant gap
                break
            elif gap_start != -1:
                # Small gap, reset
                gap_start = -1
                
        if gap_start != -1:
            # Crop the logo (top part)
            logo_img = cropped.crop((0, 0, width, gap_start))
            logo_bbox = logo_img.getbbox()
            logo_img = logo_img.crop(logo_bbox)
            logo_img.save('icon.png')
            
            # Crop the text (bottom part)
            text_img = cropped.crop((0, gap_end, width, height))
            text_bbox = text_img.getbbox()
            if text_bbox:
                text_img = text_img.crop(text_bbox)
                text_img.save('text.png')
        else:
            cropped.save('icon.png')
    else:
        cropped.save('icon.png')
