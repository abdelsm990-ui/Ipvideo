import json, re, os

i18n_path = r'C:\Users\Hp\Desktop\Ipvideo\client\js\i18n.js'

new_translations = {
    "en": {
        "testimonials_label": "Testimonials",
        "testimonials_title": "They use Ipvideo daily",
        "testimonials_desc": "Join thousands of creators, marketers & companies who have adopted AI to produce video content at scale.",
        "faq_desc": "Everything you need to know before starting with Ipvideo.",
        "faq_q1": "What is Ipvideo and how does it work?",
        "faq_a1": "Ipvideo is an AI video generation platform that turns your ideas into professional videos. Choose your format, describe your vision, and our AI generates a complete video with voice-over, music and subtitles in minutes.",
        "faq_q2": "How many videos can I create with the Pro plan?",
        "faq_a2": "The Pro plan at $25/month gives you 1,000 points. A 30-second video costs 40 points, allowing you to create about 25 videos per month. You can adjust duration and quality to optimize your quota.",
        "faq_q3": "Can I use my videos for commercial purposes?",
        "faq_a3": "Absolutely! All videos generated with the Pro plan include full commercial rights. You can use them on social media, in advertising campaigns, on your website, or even resell them to your clients without any restrictions.",
        "faq_q4": "What formats and resolutions are available?",
        "faq_a4": "We support all popular formats: landscape (16:9, 1920×1080), portrait (9:16, 1080×1920 for TikTok/Reels), and square (1:1).",
        "faq_q5": "How do I cancel my subscription?",
        "faq_a5": "You can cancel anytime from your dashboard. No commitment, no penalty. Your access remains active until the end of the paid period.",
        "cta2_title": "Turn your ideas into professional videos",
        "cta2_desc": "Join 12,000+ users already creating professional videos with AI. Free 3-day trial.",
        "btn_start_free2": "Start for free",
        "btn_see_pricing": "See pricing",
        "footer_resources": "Resources",
        "footer_legal": "Legal",
        "footer_support": "Support",
        "footer_brand_desc": "The AI video generation platform for creators, marketers and businesses. Create professional content in a few clicks.",
        "footer_link_features": "Features",
        "footer_link_pricing": "Pricing",
        "footer_link_generate": "Generate a video",
        "footer_link_login": "Login",
        "footer_link_docs": "Documentation",
        "footer_link_tutorials": "Tutorials",
        "footer_link_blog": "Blog",
        "footer_link_api": "API",
        "footer_link_about": "About",
        "footer_link_contact": "Contact",
        "footer_link_careers": "Careers",
        "footer_link_legal": "Legal notices",
        "footer_copyright": "© 2026 Ipvideo. All rights reserved.",
    },
    "ar": {
        "testimonials_label": "الشهادات",
        "testimonials_title": "يستخدمون Ipvideo يومياً",
        "testimonials_desc": "انضم إلى آلاف المبدعين والمسوقين والشركات الذين اعتمدوا الذكاء الاصطناعي لإنتاج محتوى الفيديو على نطاق واسع.",
        "faq_desc": "كل ما تحتاج لمعرفته قبل البدء مع Ipvideo.",
        "faq_q1": "ما هو Ipvideo وكيف يعمل؟",
        "faq_a1": "Ipvideo هي منصة توليد فيديو بالذكاء الاصطناعي تحول أفكارك إلى مقاطع فيديو احترافية. اختر تنسيقك، وصف رؤيتك، ويقوم ذكاؤنا الاصطناعي بتوليد فيديو كامل مع تعليق صوتي وموسيقى وترجمة في دقائق.",
        "faq_q2": "كم عدد مقاطع الفيديو التي يمكنني إنشاؤها مع خطة Pro؟",
        "faq_a2": "تمنحك خطة Pro بـ 25 دولار/شهر 1000 نقطة. تكلفة فيديو مدته 30 ثانية 40 نقطة، مما يسمح لك بإنشاء حوالي 25 فيديو شهرياً. يمكنك تعديل المدة والجودة لتحسين حصتك.",
        "faq_q3": "هل يمكنني استخدام مقاطع الفيديو الخاصة بي لأغراض تجارية؟",
        "faq_a3": "بالتأكيد! تتضمن جميع مقاطع الفيديو المولدة مع خطة Pro حقوقاً تجارية كاملة. يمكنك استخدامها على وسائل التواصل الاجتماعي، في حملاتك الإعلانية، على موقعك الإلكتروني، أو حتى إعادة بيعها لعملائك دون أي قيود.",
        "faq_q4": "ما هي التنسيقات والدقة المتاحة؟",
        "faq_a4": "ندعم جميع التنسيقات الشائعة: أفقي (16:9، 1920×1080)، عمودي (9:16، 1080×1920 لـ TikTok/Reels)، ومربع (1:1).",
        "faq_q5": "كيف يمكنني إلغاء اشتراكي؟",
        "faq_a5": "يمكنك الإلغاء في أي وقت من لوحة التحكم الخاصة بك. لا التزام، لا عقوبة. يبقى وصولك نشطاً حتى نهاية الفترة المدفوعة.",
        "cta2_title": "حول أفكارك إلى مقاطع فيديو احترافية",
        "cta2_desc": "انضم إلى أكثر من 12000 مستخدم يقومون بالفعل بإنشاء مقاطع فيديو احترافية بالذكاء الاصطناعي. تجربة مجانية لمدة 3 أيام.",
        "btn_start_free2": "ابدأ مجاناً",
        "btn_see_pricing": "انظر الأسعار",
        "footer_resources": "الموارد",
        "footer_legal": "قانوني",
        "footer_support": "الدعم",
        "footer_brand_desc": "منصة توليد الفيديو بالذكاء الاصطناعي للمبدعين والمسوقين والشركات. أنشئ محتوى احترافي ببضع نقرات.",
        "footer_link_features": "الميزات",
        "footer_link_pricing": "الأسعار",
        "footer_link_generate": "توليد فيديو",
        "footer_link_login": "تسجيل الدخول",
        "footer_link_docs": "التوثيق",
        "footer_link_tutorials": "الدروس التعليمية",
        "footer_link_blog": "المدونة",
        "footer_link_api": "واجهة برمجة التطبيقات",
        "footer_link_about": "عن الشركة",
        "footer_link_contact": "اتصل بنا",
        "footer_link_careers": "الوظائف",
        "footer_link_legal": "إشارات قانونية",
        "footer_copyright": "© 2026 Ipvideo. جميع الحقوق محفوظة.",
    }
}

with open(i18n_path, 'r', encoding='utf-8') as f:
    content = f.read()

for lang, trans in new_translations.items():
    # Find the lang block: e.g. "  en: {"
    pattern = re.compile(rf"(\s+{lang}:\s*\{{)")
    m = pattern.search(content)
    if not m:
        print(f'Block not found for {lang}')
        continue

    brace_start = m.end() - 1  # position of the opening brace
    # Find matching closing brace
    depth = 1
    i = brace_start + 1
    while i < len(content) and depth > 0:
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
        i += 1

    insert_pos = i - 1
    lines_to_add = []
    for key, value in trans.items():
        safe_value = value.replace("'", "\\'")
        lines_to_add.append(f"    {key}: '{safe_value}',\n")

    content = content[:insert_pos] + ''.join(lines_to_add) + content[insert_pos:]
    print(f'Added {len(trans)} keys to {lang}')

with open(i18n_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
