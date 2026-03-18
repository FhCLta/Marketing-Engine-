import os
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

from typing import Optional, List
from pydantic import BaseModel

# ═══════════════════════════════════════════════════════════════════
# BRISA MAYA CAPITAL — IMAGE PROCESSOR v2.0 (8K ULTRA-HD ENGINE)
# ═══════════════════════════════════════════════════════════════════

# Resolution Targets
ASPECT_RATIOS = {
    '16:9':  {'8k': (7680, 4320),  '4k': (3840, 2160)},
    '1:1':   {'8k': (4320, 4320),  '4k': (2160, 2160)},
    '9:16':  {'8k': (4320, 7680),  '4k': (2160, 3840)},
    '4:5':   {'8k': (3456, 4320),  '4k': (1728, 2160)},
}

# Fonts
FONT_SERIF = r'C:\Windows\Fonts\georgiab.ttf'
FONT_SANS = r'C:\Windows\Fonts\arial.ttf'

# ═══════════════════════════════════════════════════════════════════
# BRISA MAYA CAPITAL — BRAND THEMES & STYLES (Quiet Luxury)
# ═══════════════════════════════════════════════════════════════════

BRAND_THEMES = {
    "GOLDEN_LEGACY": {
        "accent": (212, 175, 55, 255),    # GOLD
        "headline": (255, 255, 255, 255), # WHITE
        "body": (229, 228, 226, 255),     # PLATINUM
        "vignette": (5, 8, 15, 180),
        "font_family": "serif"
    },
    "HERITAGE_NAVY": {
        "accent": (212, 175, 55, 255),    # GOLD
        "headline": (244, 241, 237, 255), # IVORY
        "body": (160, 174, 192, 255),     # SILVER
        "vignette": (0, 18, 25, 200),
        "font_family": "serif"
    },
    "OBSIDIAN_LUXE": {
        "accent": (229, 228, 226, 255),   # PLATINUM
        "headline": (255, 255, 255, 255), # WHITE
        "body": (233, 233, 233, 255),     # CLOUD
        "vignette": (10, 10, 12, 220),
        "font_family": "sans"
    },
    "COASTAL_IVORY": {
        "accent": (0, 95, 115, 255),      # TEAL
        "headline": (30, 30, 30, 255),    # ONYX
        "body": (52, 58, 64, 255),        # SLATE
        "vignette": (249, 247, 242, 120), # Light vignette
        "font_family": "serif"
    }
}

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(BASE_DIR, 'assets', 'logo_transparent.png')

class AdParameters(BaseModel):
    super_headline: str
    main_headline: str
    body_text: str
    layout: str = "left"
    theme: str = "GOLDEN_LEGACY"      # "GOLDEN_LEGACY", "HERITAGE_NAVY", etc.
    
    output_quality: str = "8k"        # "8k", "4k", "original"
    output_format: str = "jpeg"       # "jpeg" or "png"
    color_enhance: bool = True        # Auto-enhance colors
    aspect_ratio: str = "original"    # "original", "1:1", "9:16", "16:9", "4:5"
    
    # Granular Color Overrides (hex strings, e.g. "#d4af37")
    accent_color_hex: Optional[str] = None
    text_color_hex: Optional[str] = None
    body_color_hex: Optional[str] = None
    logo_color_hex: Optional[str] = None
    line_color_hex: Optional[str] = None
    
    # Legacy overrides
    accent_override: str = None
    font_override: str = None


def _adapt_to_aspect_ratio(img: Image.Image, aspect_ratio: str, quality: str) -> Image.Image:
    """Smart crop and resize image to target aspect ratio."""
    if aspect_ratio == 'original':
        # Escalar manteniendo el ratio original pero a resolución 8K/4K
        return _upscale_to_target(img, quality, img.width, img.height, keep_original_ratio=True)
    
    # Get target dimensions for the chosen aspect ratio and quality
    ratio_config = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS['16:9'])
    
    if quality in ratio_config:
        target_w, target_h = ratio_config[quality]
    elif quality == 'original':
        # Calculate dimensions based on aspect ratio but keep similar pixel count
        w, h = img.size
        parts = aspect_ratio.split(':')
        ratio_w, ratio_h = int(parts[0]), int(parts[1])
        # Scale to match the larger source dimension
        if w / h > ratio_w / ratio_h:
            target_h = h
            target_w = int(h * ratio_w / ratio_h)
        else:
            target_w = w
            target_h = int(w * ratio_h / ratio_w)
        return _smart_crop(img, target_w, target_h)
    else:
        target_w, target_h = ratio_config.get('4k', (3840, 2160))
    
    return _smart_crop(img, target_w, target_h)


def _smart_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Resize and center-crop image to exact target dimensions."""
    w, h = img.size
    
    # Scale to cover the target area (no empty space)
    scale = max(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center crop to exact target
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))
    
    return img


def _upscale_to_target(img: Image.Image, quality: str, fallback_w: int = 7680, fallback_h: int = 4320, keep_original_ratio: bool = False) -> Image.Image:
    """Upscale image to target resolution using LANCZOS for maximum quality."""
    if quality == "original":
        return img

    w, h = img.size
    
    # Calculate current aspect ratio
    aspect_ratio = w / h

    if keep_original_ratio:
        # Determine target dimensions based on the larger side to hit the target quality roughly
        if quality == "8k":
            max_side = 7680
        elif quality == "4k":
            max_side = 3840
        else:
            return img
            
        if w >= h:
            target_w = max_side
            target_h = int(max_side / aspect_ratio)
        else:
            target_h = max_side
            target_w = int(max_side * aspect_ratio)
    else:
        if quality == "8k":
            target_w, target_h = fallback_w, fallback_h
        elif quality == "4k":
            target_w, target_h = max(1, fallback_w // 2), max(1, fallback_h // 2)
        else:
            return img
    
    # Calculate scale factor
    if keep_original_ratio:
        scale = max(target_w / w, target_h / h)
    else:
        # Preserving aspect ratio but covering the full target bounding box
        scale = max(target_w / w, target_h / h)
    
    if scale <= 1.0:
        # Image is already larger than target, no upscale needed
        return img
    
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    # Use LANCZOS resampling for the sharpest possible upscale
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    if not keep_original_ratio:
        # Crop to exact target dimensions (center crop)
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        img = img.crop((left, top, left + target_w, top + target_h))
    
    return img


def _enhance_colors(img: Image.Image, intensity=1.0) -> Image.Image:
    """Apply professional color enhancement with adjustable intensity."""
    rgb_img = img.convert('RGB')
    
    # Saturation (scaled by intensity)
    enhancer = ImageEnhance.Color(rgb_img)
    rgb_img = enhancer.enhance(1.0 + (0.20 * intensity))
    
    # Contrast
    enhancer = ImageEnhance.Contrast(rgb_img)
    rgb_img = enhancer.enhance(1.0 + (0.10 * intensity))
    
    # Sharpness
    enhancer = ImageEnhance.Sharpness(rgb_img)
    rgb_img = enhancer.enhance(1.0 + (0.15 * intensity))
    
    result = rgb_img.convert('RGBA')
    if img.mode == 'RGBA':
        result.putalpha(img.split()[3])
    return result

def _apply_cinematic_filter(img: Image.Image, filter_name: str) -> Image.Image:
    """Apply specific artistic color grades."""
    if filter_name == "MISTRAL":
        # Cool, desaturated, high contrast
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(0.8)
        # Sligth blue tint (simplified via processing)
        pass 
    elif filter_name == "CANDELA":
        # Warm, golden, soft
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.2)
    return img


def process_image(image_bytes: bytes, params: AdParameters) -> bytes:
    """Main image processing pipeline: Upscale → Enhance → Compose → Export."""
    
    img = Image.open(BytesIO(image_bytes)).convert('RGBA')
    theme_cfg = BRAND_THEMES.get(params.theme.upper(), BRAND_THEMES["GOLDEN_LEGACY"])
    
    # ═══ STEP 0: ADAPT TO ASPECT RATIO + UPSCALE ═══
    img = _adapt_to_aspect_ratio(img, params.aspect_ratio, params.output_quality)
    
    # ═══ STEP 0.5: ENHANCE COLORS ═══
    if params.color_enhance:
        img = _enhance_colors(img)
    
    width, height = img.size
    is_square = abs(width - height) < (width * 0.05)  # ~1:1
    is_vertical = height > width and not is_square  # Reel / Story format
    
    # ═══ FORMAT-AWARE POSITIONING ═══
    if is_square:
        logo_y_pct = 0.02
        logo_h_pct = 0.13
        copy_y_start = 0.58
        font_scale = 0.60  # Much smaller for square — text must fit width
    elif is_vertical:
        logo_y_pct = 0.03
        logo_h_pct = 0.10
        copy_y_start = 0.52
        font_scale = 0.65
    else:  # landscape 16:9
        logo_y_pct = 0.02
        logo_h_pct = 0.18
        copy_y_start = 0.65
        font_scale = 1.0
    
    # Maximum text width (prevents overflow)
    max_text_width = width - (width * 0.16)  # 8% margin each side
    
    # ═══ STEP 1: CINEMATIC GRADIENT OVERLAY ═══
    gradient = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw_grad = ImageDraw.Draw(gradient)
    
    # Top gradient (dramatic vignette for logo area)
    top_vignette_h = int(height * 0.28)
    for y in range(top_vignette_h):
        alpha = int(130 - (y / top_vignette_h) * 130)
        draw_grad.line([(0, y), (width, y)], fill=(5, 8, 15, alpha))
    
    # Bottom gradient (strong cinematic, for text legibility)
    grad_start_pct = 0.30 if is_vertical else (0.35 if is_square else 0.40)
    gradient_start = int(height * grad_start_pct)
    for y in range(gradient_start, height):
        progress = (y - gradient_start) / (height - gradient_start)
        # More aggressive curve for stronger coverage
        alpha = int((progress ** 1.0) * 245)
        draw_grad.line([(0, y), (width, y)], fill=(5, 8, 15, alpha))
    
    img = Image.alpha_composite(img, gradient)
    draw = ImageDraw.Draw(img)

    # ═══ STEP 2: FONTS ═══
    font_theme = BRAND_THEMES.get(params.theme, BRAND_THEMES["GOLDEN_LEGACY"])
    font_main = FONT_SERIF if font_theme["font_family"] == "serif" else FONT_SANS
    
    try:
        f_logo_title = ImageFont.truetype(FONT_SERIF, int(height * 0.040 * font_scale))
        f_logo_sub   = ImageFont.truetype(FONT_SANS,  int(height * 0.015 * font_scale))
        f_super      = ImageFont.truetype(FONT_SANS,  int(height * 0.032 * font_scale))
        f_title      = ImageFont.truetype(font_main,  int(height * 0.075 * font_scale))
        f_body       = ImageFont.truetype(FONT_SANS,  int(height * 0.028 * font_scale))
    except:
        f_logo_title = f_logo_sub = f_super = f_title = f_body = ImageFont.load_default()

    margin_x = width * 0.08

    # Use mutable container to allow nested functions to modify img/draw
    state = {'img': img, 'draw': draw}

    def draw_text_with_shadow(xy, text, font, fill, align_mode, shadow_radius=None):
        """Draw text with a subtle drop shadow for legibility on any background."""
        x, y = xy
        if shadow_radius is None:
            shadow_radius = max(2, int(height * 0.002))
        
        # Create shadow layer
        shadow_layer = Image.new('RGBA', state['img'].size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow_layer)
        shadow_draw.multiline_text((x, y + shadow_radius), text, font=font, 
                                    fill=(0, 0, 0, 120), align=align_mode)
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=shadow_radius * 2))
        
        # Composite shadow onto main image
        state['img'] = Image.alpha_composite(state['img'], shadow_layer)
        state['draw'] = ImageDraw.Draw(state['img'])
        
        # Draw actual text
        state['draw'].multiline_text((x, y), text, font=font, fill=fill, align=align_mode)

    def wrap_text(text, font, max_w):
        """Word-wrap text to fit within max_w pixels."""
        lines = text.split('\n')
        wrapped = []
        for line in lines:
            words = line.split(' ')
            current = ''
            for word in words:
                test = f'{current} {word}'.strip()
                bbox = state['draw'].textbbox((0, 0), test, font=font)
                if bbox[2] - bbox[0] > max_w and current:
                    wrapped.append(current)
                    current = word
                else:
                    current = test
            if current:
                wrapped.append(current)
        return '\n'.join(wrapped)

    def draw_dynamic_text(y, text, font, fill, align_mode, use_shadow=True):
        # Auto-wrap text to fit within margins
        text = wrap_text(text, font, max_text_width)
        
        bbox = state['draw'].multiline_textbbox((0, 0), text, font=font, align=align_mode)
        text_w = bbox[2] - bbox[0]
        
        if align_mode == 'center':
            x = (width - text_w) / 2
        elif align_mode == 'right':
            x = width - margin_x - text_w
        else:
            x = margin_x
        
        if use_shadow:
            draw_text_with_shadow((x, y), text, font, fill, align_mode)
        else:
            state['draw'].multiline_text((x, y), text, font=font, fill=fill, align=align_mode)
        
        real_bbox = state['draw'].multiline_textbbox((x, y), text, font=font, align=align_mode)
        return real_bbox[3]

    def draw_centered_text(y, text, font, fill):
        bbox = state['draw'].textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        x = (width - text_w) / 2
        state['draw'].text((x, y), text, font=font, fill=fill)
        return bbox[3]

    # ═══ HELPER: Color conversion (must be before STEP 3) ═══
    def hex_to_rgba(hex_str):
        """Convert hex color string to RGBA tuple."""
        if not hex_str:
            return None
        hex_str = hex_str.lstrip('#')
        if len(hex_str) == 6:
            r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
            return (r, g, b, 255)
        return None

    # ═══ STEP 3: LOGO ═══
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image.open(LOGO_PATH).convert('RGBA')
            crop_box = (0, 0, logo.width, int(logo.height * 0.58))
            logo = logo.crop(crop_box)
            
            target_h = int(height * logo_h_pct)
            logo_aspect = logo.width / logo.height
            target_w = int(target_h * logo_aspect)
            logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            alpha = logo.split()[3]
            
            # Tint logo with requested color (granular override > theme accent)
            logo_override = hex_to_rgba(params.logo_color_hex) if hasattr(params, 'logo_color_hex') and params.logo_color_hex else None
            logo_tint = logo_override or theme_cfg["accent"]
            solid_color = Image.new('RGBA', logo.size, logo_tint)
            logo = Image.composite(solid_color, Image.new('RGBA', logo.size, (0, 0, 0, 0)), alpha)

            logo_x = int((width - target_w) / 2)
            logo_y = int(height * logo_y_pct)
            
            # Shadow layers for logo
            logo_layer = Image.new('RGBA', state['img'].size, (0, 0, 0, 0))
            
            shadow = logo.copy()
            shadow_color = Image.new('RGBA', shadow.size, (0, 0, 0, 255))
            shadow = Image.composite(shadow_color, Image.new('RGBA', shadow.size, (0, 0, 0, 0)), shadow.split()[3])
            
            shadow_tight = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, int(height * 0.002))))
            shadow_soft  = shadow.filter(ImageFilter.GaussianBlur(radius=max(4, int(height * 0.005))))
            
            logo_layer.paste(shadow_soft,  (logo_x, logo_y), mask=shadow_soft)
            logo_layer.paste(shadow_tight, (logo_x, logo_y), mask=shadow_tight)
            logo_layer.paste(logo, (logo_x, logo_y), mask=logo)
            
            state['img'] = Image.alpha_composite(state['img'], logo_layer)
            state['draw'] = ImageDraw.Draw(state['img'])
        except Exception as e:
            print(f"Error procesando el logo PNG: {e}")
    else:
        y_logo = height * 0.05
        y_logo = draw_centered_text(y_logo, "BRISA MAYA", f_logo_title, theme_cfg["accent"])
        y_logo = draw_centered_text(y_logo + 5, "CAPITAL", f_logo_sub, theme_cfg["body"])
        state['draw'].line([(width/2 - 50, y_logo + 15), (width/2 + 50, y_logo + 15)], fill=theme_cfg["accent"], width=2)

    # ═══ STEP 4: COPY TEXT ═══
    current_y = height * copy_y_start
    align_mode = params.layout.lower()
    
    # Start with theme defaults, then apply granular overrides
    accent = hex_to_rgba(params.accent_color_hex) or theme_cfg["accent"]
    super_color = accent
    main_text_color = hex_to_rgba(params.text_color_hex) or theme_cfg["headline"]
    body_text_color = hex_to_rgba(params.body_color_hex) or theme_cfg["body"]
    line_color = hex_to_rgba(params.line_color_hex) or accent
    
    # DEBUG: print color values
    print(f"\n--- IMAGE PROCESSOR DEBUG ---")
    print(f"Params: accent={params.accent_color_hex}, text={params.text_color_hex}, body={params.body_color_hex}, logo={params.logo_color_hex}, line={params.line_color_hex}")
    print(f"Resolved: accent={accent}, main_text={main_text_color}, body={body_text_color}, line={line_color}")
    print(f"-----------------------------\n")

    # Super headline (accent color, with subtle shadow)
    current_y = draw_dynamic_text(current_y, params.super_headline, f_super, super_color, align_mode, use_shadow=True)
    
    # Premium accent line with glow
    current_y += height * 0.015
    line_w = width * 0.08
    line_thickness = max(2, int(height * 0.0012))
    
    # Glow effect behind the line
    glow_layer = Image.new('RGBA', state['img'].size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    glow_color = (line_color[0], line_color[1], line_color[2], 40)
    
    if align_mode == 'center':
        lx = width/2 - line_w/2
    elif align_mode == 'right':
        lx = width - margin_x - line_w
    else:
        lx = margin_x
    
    # Draw glow
    for offset in range(1, max(3, int(height * 0.003))):
        glow_draw.line([(lx, current_y - offset), (lx + line_w, current_y - offset)], fill=glow_color, width=1)
        glow_draw.line([(lx, current_y + offset), (lx + line_w, current_y + offset)], fill=glow_color, width=1)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=max(2, int(height * 0.002))))
    state['img'] = Image.alpha_composite(state['img'], glow_layer)
    state['draw'] = ImageDraw.Draw(state['img'])
    
    # Solid accent line
    state['draw'].line([(lx, current_y), (lx + line_w, current_y)], fill=line_color, width=line_thickness)
    current_y += height * 0.02
    
    # Main headline (with shadow for maximum legibility)
    current_y = draw_dynamic_text(current_y, params.main_headline, f_title, main_text_color, align_mode, use_shadow=True)
    current_y += height * 0.015
    
    # Body text (with subtle shadow)
    current_y = draw_dynamic_text(current_y, params.body_text, f_body, body_text_color, align_mode, use_shadow=True)

    # ═══ STEP 5: EXPORT AT MAXIMUM QUALITY ═══
    out_io = BytesIO()
    
    img = state['img']
    
    if params.output_format.lower() == "png":
        # PNG: Lossless, maximum quality, larger file
        img.convert('RGBA').save(out_io, format="PNG", optimize=True)
    else:
        # JPEG: Quality 100 (maximum), with subsampling disabled for sharpest output
        img.convert('RGB').save(
            out_io, 
            format="JPEG", 
            quality=100, 
            subsampling=0,    # 4:4:4 chroma — no color bleed
            optimize=True     # Huffman optimization
        )
    
    return out_io.getvalue()
