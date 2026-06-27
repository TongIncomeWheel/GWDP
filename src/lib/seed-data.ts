import type { OralExercise } from "./types";

export function getSeedExercises(): Omit<OralExercise, "id">[] {
  return [
    // ============================================================
    // Theme 1: Community and Kindness (Foundation, isDaily: true)
    // ============================================================
    {
      type: "READING",
      title: "A Helping Hand in the Neighbourhood",
      topic: "Community and Kindness",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Last Saturday, something wonderful happened in my neighbourhood that reminded me of the power of kindness. Our elderly neighbour, Mdm Ong, had been struggling to carry her heavy grocery bags up the stairs because the lift in our block was under repair. Without hesitation, my mother nudged me forward and said, \"Go and help her, Wei Ming.\"\n\nI rushed over and took the bags from Mdm Ong's trembling hands. Her face lit up with gratitude. \"Thank you, child,\" she whispered, her eyes glistening with tears. Together, we climbed the five flights of stairs slowly, one step at a time.\n\nWhen we reached her door, she invited me in for a glass of chrysanthemum tea and told me stories about the kampung days, when neighbours looked out for one another like family. That afternoon, I learnt that kindness does not require grand gestures. Sometimes, the simplest act of helping someone carry their groceries can make a world of difference. It strengthened the bond between our families and reminded me that a caring community begins with each one of us.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: true,
      preamblePact:
        '{"purpose":"To recount a personal experience about kindness","audience":"Classmates and teacher","context":"A neighbourhood setting in Singapore","tone":"Warm, reflective, and sincere"}',
      readingTips:
        "Speak warmly when quoting Mdm Ong. Slow down at emotional moments. Emphasise words like 'gratitude', 'trembling', and 'glistening'. Use a reflective tone in the final paragraph.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "A Helping Hand in the Neighbourhood (SBC)",
      topic: "Community and Kindness",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A heartwarming photograph taken in a Singapore HDB void deck. Several young students wearing school uniforms are helping elderly residents carry bags of groceries from a nearby market. One boy is holding an umbrella over an elderly woman using a walking stick while another girl carefully places fruit into a reusable bag. In the background, a community notice board displays a poster reading 'Kindness Week' with colourful drawings. The atmosphere is cheerful, with residents smiling and chatting. Potted plants line the edges of the void deck, adding a touch of greenery to the scene.",
      question1:
        "What do you think is happening in this photograph? Why do you think the students are helping the elderly residents?",
      question2:
        "Tell me about a time when you helped someone in your community. How did it make you feel?",
      question3:
        "Do you think young people today do enough to help the elderly in their neighbourhood? Why or why not?",
      isDaily: true,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A heartwarming photograph taken in a Singapore HDB void deck. Several young students wearing school uniforms are helping elderly residents carry bags of groceries from a nearby market. One boy is holding an umbrella over an elderly woman using a walking stick while another girl carefully places fruit into a reusable bag. In the background, a community notice board displays a poster reading 'Kindness Week' with colourful drawings. The atmosphere is cheerful, with residents smiling and chatting. Potted plants line the edges of the void deck, adding a touch of greenery to the scene.",
      imageSearchSuggestion:
        "Singapore students helping elderly HDB community volunteer",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 2: Environment and Sustainability (Foundation, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "Our Green School Initiative",
      topic: "Environment and Sustainability",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Dear fellow students, I am writing to share an exciting project that our school has embarked on this term. As part of the Green School Initiative, every class has been given a small garden plot to grow vegetables and herbs. Our class chose to plant kangkong and basil, and I must say, the results have been truly rewarding.\n\nEvery morning before assembly, a group of us would water the plants and pull out weeds. At first, I found it tedious and wondered why we could not simply buy vegetables from the supermarket. However, as the weeks passed and tiny green shoots began to appear, I felt a growing sense of pride and accomplishment.\n\nOur teacher, Mr. Rajagopal, explained that growing our own food reduces the carbon footprint caused by transporting produce from overseas. He also taught us about composting food waste to create natural fertiliser. Through this project, I have come to understand that protecting our environment is not just about big changes. It starts with small, everyday actions that each of us can take to make our planet a better place for future generations.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To persuade others to care for the environment","audience":"Fellow students at a school assembly","context":"A school gardening initiative in Singapore","tone":"Enthusiastic, informative, and encouraging"}',
      readingTips:
        "Use an enthusiastic tone when describing the project. Pause before the reflection about finding it tedious. Stress the contrast between initial reluctance and later pride. Read the final sentence with conviction.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Our Green School Initiative (SBC)",
      topic: "Environment and Sustainability",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a school garden in Singapore. Primary school students in PE attire are tending to raised garden beds filled with leafy vegetables like kangkong, lettuce, and chye sim. One student is carefully watering plants with a watering can while another is scooping compost from a bin labelled 'Food Waste Compost'. A teacher stands nearby, pointing at a chart showing the plant growth cycle. Behind them, a banner reads 'Green School Initiative - Every Seed Counts'. The garden is surrounded by the school building, with solar panels visible on the rooftop.",
      question1:
        "What are the students doing in this photograph? What do you think they might learn from this activity?",
      question2:
        "Does your school have any programmes to help the environment? Tell me about one that you have taken part in.",
      question3:
        "Some people say that schools should spend more time on environmental projects even if it means less time for academic subjects. Do you agree?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a school garden in Singapore. Primary school students in PE attire are tending to raised garden beds filled with leafy vegetables like kangkong, lettuce, and chye sim. One student is carefully watering plants with a watering can while another is scooping compost from a bin labelled 'Food Waste Compost'. A teacher stands nearby, pointing at a chart showing the plant growth cycle. Behind them, a banner reads 'Green School Initiative - Every Seed Counts'. The garden is surrounded by the school building, with solar panels visible on the rooftop.",
      imageSearchSuggestion:
        "Singapore primary school garden students growing vegetables environmental education",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 3: Technology and Screen Time (Foundation, isDaily: true)
    // ============================================================
    {
      type: "READING",
      title: "The Digital Detox Challenge",
      topic: "Technology and Screen Time",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "I have a confession to make. Until last month, I spent nearly five hours every day glued to my tablet, watching videos and playing games. My parents were worried. My grades had slipped, and I had stopped playing badminton with my friends at the court downstairs. \"You are missing out on life,\" my father told me one evening, his voice tinged with concern.\n\nThat was when my family decided to take on the Digital Detox Challenge. For one whole week, we would limit our screen time to just one hour a day. The first two days were agonising. I felt restless and did not know what to do with my time. But by the third day, something shifted. I picked up a book I had abandoned months ago. I helped my mother bake pineapple tarts. I even went cycling with my younger brother along the park connector.\n\nBy the end of the week, I realised that the world beyond my screen was far more interesting than I had imagined. Technology is a wonderful tool, but it should never replace the joy of real experiences and genuine human connections.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: true,
      preamblePact:
        '{"purpose":"To share a personal experience about reducing screen time","audience":"Classmates during a class sharing session","context":"A family challenge to reduce device usage","tone":"Honest, reflective, and persuasive"}',
      readingTips:
        "Sound confessional at the opening. Use a concerned tone when quoting the father. Build energy as you describe the positive activities discovered. End with a firm, persuasive delivery.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Digital Detox Challenge (SBC)",
      topic: "Technology and Screen Time",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph showing a family of four sitting together in a bright, modern living room in Singapore. The father and mother are playing a board game with their two children, a boy and a girl aged around eleven. Smartphones and a tablet are placed inside a basket on a shelf in the background, with a handwritten sign reading 'Device-Free Zone'. The family is laughing and engaged in the game. On the coffee table, there are snacks and drinks. Through the window, an HDB estate and playground are visible in the warm evening light.",
      question1:
        "What do you notice about the devices in the background of this photograph? Why do you think the family has done this?",
      question2:
        "How much time do you spend on electronic devices each day? Do you think it is too much, too little, or just right?",
      question3:
        "Some people believe that children under twelve should not be allowed to own a smartphone. What is your opinion?",
      isDaily: true,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph showing a family of four sitting together in a bright, modern living room in Singapore. The father and mother are playing a board game with their two children, a boy and a girl aged around eleven. Smartphones and a tablet are placed inside a basket on a shelf in the background, with a handwritten sign reading 'Device-Free Zone'. The family is laughing and engaged in the game. On the coffee table, there are snacks and drinks. Through the window, an HDB estate and playground are visible in the warm evening light.",
      imageSearchSuggestion:
        "family board game no phones digital detox living room Singapore",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 4: Sports and Resilience (Foundation, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Race That Taught Me Never to Give Up",
      topic: "Sports and Resilience",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "The starting whistle pierced the morning air, and my legs surged forward with the crowd of runners. It was the annual cross-country race, and I had been training for weeks. My target was simple: to finish in the top twenty. By the second kilometre, I was keeping a steady pace, my breathing controlled and rhythmic.\n\nThen disaster struck. My foot caught on a tree root, and I tumbled forward, skidding across the gravel path. Pain shot through my right knee, which was now bleeding. For a moment, I wanted to give up. Tears stung my eyes as other runners overtook me.\n\nBut then I heard my coach's voice from the sideline. \"Get up, Priya! You did not train so hard just to sit on the ground!\" Her words ignited something inside me. Gritting my teeth, I stood up and began running again, slower this time but with fierce determination. I did not finish in the top twenty. I came in thirty-second. Yet when I crossed the finish line, the cheers from my teammates felt like the greatest victory I had ever earned. That day, I learnt that resilience is not about winning. It is about refusing to quit.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To recount a challenging sporting experience and its lesson","audience":"School assembly","context":"An annual school cross-country race","tone":"Dramatic, determined, and inspiring"}',
      readingTips:
        "Start with energy to convey the excitement of the race. Slow down dramatically when describing the fall. Use an urgent, motivating voice for the coach's quote. Build to a triumphant finish.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Race That Taught Me Never to Give Up (SBC)",
      topic: "Sports and Resilience",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph from a primary school sports day in Singapore. A young girl in a red sports jersey is crossing the finish line of a running race on a school field, her face showing both exhaustion and triumph. Her right knee has a visible bandage. Behind her, several other students are still running. On the sidelines, classmates and teachers are cheering enthusiastically, waving small flags. A large banner strung across the field reads 'Annual Sports Day - Perseverance Wins'. The school building and a bright blue sky form the backdrop.",
      question1:
        "Look at the girl crossing the finish line. What do you think might have happened to her during the race? What makes you think so?",
      question2:
        "Tell me about a time when you faced a difficulty during a sports event or physical activity. How did you overcome it?",
      question3:
        "Do you think it is more important to win a competition or to try your best even if you do not win? Explain your view.",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph from a primary school sports day in Singapore. A young girl in a red sports jersey is crossing the finish line of a running race on a school field, her face showing both exhaustion and triumph. Her right knee has a visible bandage. Behind her, several other students are still running. On the sidelines, classmates and teachers are cheering enthusiastically, waving small flags. A large banner strung across the field reads 'Annual Sports Day - Perseverance Wins'. The school building and a bright blue sky form the backdrop.",
      imageSearchSuggestion:
        "primary school sports day girl finish line running perseverance Singapore",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 5: Food and Hawker Culture (Foundation, isDaily: true)
    // ============================================================
    {
      type: "READING",
      title: "Saving Our Hawker Heritage",
      topic: "Food and Hawker Culture",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Every Sunday morning, my grandfather and I have a special tradition. We walk to the hawker centre near our home, where he orders his favourite bowl of fish ball noodles from Uncle Tan's stall. Uncle Tan has been running his stall for over forty years, waking up at four in the morning to prepare his handmade fish balls from scratch.\n\n\"These are not like the factory ones,\" my grandfather always says proudly, slurping his noodles with delight. \"Uncle Tan puts his heart into every single ball.\" Sadly, Uncle Tan told us recently that he might have to close his stall soon. His children do not wish to take over the business, and the long hours are taking a toll on his aging body.\n\nThis news troubled me deeply. Singapore's hawker culture was recognised by UNESCO as an Intangible Cultural Heritage in 2020. Yet if the next generation does not step forward, we risk losing these treasured recipes and the warm community spirit that hawker centres represent. I believe we must find ways to support our hawker heroes before their legacy disappears forever.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: true,
      preamblePact:
        '{"purpose":"To highlight the importance of preserving hawker culture","audience":"Classmates and teachers","context":"A personal connection to a local hawker centre","tone":"Nostalgic, concerned, and persuasive"}',
      readingTips:
        "Use a warm, fond tone when describing the Sunday tradition. Voice the grandfather's quote with pride and affection. Shift to a more serious, concerned tone when discussing the potential closure. End with urgency and conviction.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Saving Our Hawker Heritage (SBC)",
      topic: "Food and Hawker Culture",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A lively photograph of a busy Singapore hawker centre during lunchtime. An elderly hawker wearing a white apron and cap is serving a steaming plate of chicken rice to a smiling customer across the counter. The stall's signboard shows prices and a long menu written in English and Chinese. Behind the hawker, large pots of broth simmer on gas stoves. In the foreground, families and office workers are seated at round tables, enjoying a variety of dishes. Ceiling fans spin overhead. A small sign on the stall reads 'Since 1978', highlighting the stall's long history.",
      question1:
        "What can you tell about the hawker and his stall from this photograph? What clues suggest he has been doing this for a long time?",
      question2:
        "What is your favourite hawker food? Describe a memorable experience you have had at a hawker centre.",
      question3:
        "Some people think that hawker food should be replaced by modern food courts with air conditioning. Do you agree? Why or why not?",
      isDaily: true,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A lively photograph of a busy Singapore hawker centre during lunchtime. An elderly hawker wearing a white apron and cap is serving a steaming plate of chicken rice to a smiling customer across the counter. The stall's signboard shows prices and a long menu written in English and Chinese. Behind the hawker, large pots of broth simmer on gas stoves. In the foreground, families and office workers are seated at round tables, enjoying a variety of dishes. Ceiling fans spin overhead. A small sign on the stall reads 'Since 1978', highlighting the stall's long history.",
      imageSearchSuggestion:
        "Singapore hawker centre elderly hawker cooking chicken rice stall heritage",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 6: Mental Health and Stress (Foundation, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "It Is Okay Not to Be Okay",
      topic: "Mental Health and Stress",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "For weeks, I had been feeling a heavy weight on my shoulders that I could not explain. My PSLE examinations were approaching, and everywhere I turned, someone was reminding me how important they were. \"Study harder,\" my tuition teacher urged. \"Do not disappoint us,\" a relative said during a family gathering. The pressure was suffocating.\n\nOne evening, I broke down in tears at my desk. My mother found me with my head buried in my arms, my revision papers scattered on the floor. Instead of scolding me, she sat beside me quietly and held my hand. \"It is okay not to be okay,\" she said gently. \"Your health and happiness matter more than any grade.\"\n\nThose words were like a cool breeze on a scorching day. We talked for over an hour about my fears and worries. She helped me create a realistic study schedule and promised that we would take short breaks together. That night, for the first time in weeks, I slept peacefully. I learnt that asking for help is not a sign of weakness. It is one of the bravest things a person can do.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To share a personal story about managing stress","audience":"Classmates during a wellness assembly","context":"Examination pressure faced by primary school students","tone":"Vulnerable, honest, and hopeful"}',
      readingTips:
        "Convey the heaviness and pressure in the opening lines. Read the adults' quotes with firm, expectant tones. Soften your voice significantly for the mother's comforting words. End with quiet strength and hope.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "It Is Okay Not to Be Okay (SBC)",
      topic: "Mental Health and Stress",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a quiet corner in a school counselling room. A young student is sitting on a comfortable beanbag chair, talking to a school counsellor who is listening attentively and taking notes on a clipboard. The room is decorated with calming pastel colours and motivational posters that read 'It is okay to ask for help' and 'You are not alone'. A small shelf holds fidget toys and stress balls. On the wall, there is a feelings chart with different emoji faces labelled with emotions like 'happy', 'worried', 'sad', and 'confused'. Soft natural light enters through a window with curtains partially drawn.",
      question1:
        "What do you think the student and the counsellor are talking about? What details in the photograph give you clues?",
      question2:
        "Have you ever felt stressed about school or exams? What did you do to feel better?",
      question3:
        "Do you think every school should have a counsellor whom students can talk to freely? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a quiet corner in a school counselling room. A young student is sitting on a comfortable beanbag chair, talking to a school counsellor who is listening attentively and taking notes on a clipboard. The room is decorated with calming pastel colours and motivational posters that read 'It is okay to ask for help' and 'You are not alone'. A small shelf holds fidget toys and stress balls. On the wall, there is a feelings chart with different emoji faces labelled with emotions like 'happy', 'worried', 'sad', and 'confused'. Soft natural light enters through a window with curtains partially drawn.",
      imageSearchSuggestion:
        "school counselling room student talking counsellor mental health support",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 7: Elderly and Intergenerational Bonds (Foundation, isDaily: true)
    // ============================================================
    {
      type: "READING",
      title: "Lessons from My Grandmother",
      topic: "Elderly and Intergenerational Bonds",
      difficulty: "Foundation",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "My grandmother is eighty-three years old, and she is the wisest person I know. Every weekend, I visit her at her flat in Toa Payoh, where the aroma of her home-cooked curry fills the entire corridor. While she stirs the pot, she tells me stories about growing up in a kampung where everyone shared what little they had.\n\n\"We did not have much, but we had each other,\" she often says, her wrinkled hands moving gracefully as she slices onions. She taught me how to fold dumplings, how to sew a button, and most importantly, how to be patient. \"Good things take time, Hui Ling,\" she reminds me whenever I rush through my work.\n\nLast month, I taught her how to make a video call on her tablet so she could see her sister in Penang. Her laughter when her sister's face appeared on the screen was the most beautiful sound I had ever heard. In that moment, I understood that the bond between young and old is a precious bridge. We learn from each other, and together, we keep our family stories alive for generations to come.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: true,
      preamblePact:
        '{"purpose":"To celebrate the relationship between grandchild and grandmother","audience":"Classmates and family members","context":"Regular visits to grandmother in Singapore","tone":"Loving, nostalgic, and appreciative"}',
      readingTips:
        "Use a warm, loving tone throughout. Speak the grandmother's dialogue slowly and gently, mimicking an elderly voice. Pause after emotional moments. Read the final lines about the bond with genuine feeling and sincerity.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Lessons from My Grandmother (SBC)",
      topic: "Elderly and Intergenerational Bonds",
      difficulty: "Foundation",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A touching photograph in the kitchen of an HDB flat. An elderly grandmother wearing a floral blouse is teaching her young granddaughter, around eleven years old, how to wrap traditional rice dumplings at a wooden table covered with bamboo leaves, rice, and fillings. The grandmother's hands are guiding the girl's hands to fold the leaf correctly. Both are smiling. On the kitchen counter behind them, there are jars of spices, a rice cooker, and framed family photos. A calendar on the wall shows the month of June, suggesting it is near the Dragon Boat Festival. The kitchen has a warm, homely atmosphere.",
      question1:
        "What activity are the grandmother and granddaughter doing together? Why do you think this kind of activity is meaningful?",
      question2:
        "Tell me about something special that an elderly family member has taught you. Why is it important to you?",
      question3:
        "In Singapore, some elderly people live alone and feel lonely. What can young people do to help them feel less isolated?",
      isDaily: true,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A touching photograph in the kitchen of an HDB flat. An elderly grandmother wearing a floral blouse is teaching her young granddaughter, around eleven years old, how to wrap traditional rice dumplings at a wooden table covered with bamboo leaves, rice, and fillings. The grandmother's hands are guiding the girl's hands to fold the leaf correctly. Both are smiling. On the kitchen counter behind them, there are jars of spices, a rice cooker, and framed family photos. A calendar on the wall shows the month of June, suggesting it is near the Dragon Boat Festival. The kitchen has a warm, homely atmosphere.",
      imageSearchSuggestion:
        "grandmother granddaughter making dumplings together HDB kitchen intergenerational",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 8: Reading and Books (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Magic of Reading",
      topic: "Reading and Books",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "If you asked me to name the greatest adventure I have ever been on, I would not tell you about a trip to a theme park or a holiday overseas. I would tell you about the adventures I have found between the pages of a book. Reading has taken me to places no aeroplane could reach. I have sailed with pirates across stormy seas, solved mysteries in foggy London streets, and walked alongside dinosaurs in prehistoric jungles.\n\nMy love for reading began when my father read \"Charlie and the Chocolate Factory\" to me at bedtime. I was only six, but I remember the way his voice changed for each character, how Willy Wonka sounded mischievous and Grandpa Joe sounded full of wonder. From that night on, I was hooked.\n\nToday, I carry a book with me wherever I go. On the MRT, during recess, even while waiting at the dentist. Some of my classmates tease me, calling me a bookworm. But I wear that title with pride. A book is a passport to a thousand worlds, and the best part is that every reader gets to choose their own destination. I urge each of you to pick up a book today and discover the magic for yourselves.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To inspire others to develop a love for reading","audience":"School assembly","context":"A personal speech about the joy of books","tone":"Passionate, imaginative, and persuasive"}',
      readingTips:
        "Use vivid, enthusiastic delivery when describing imaginary adventures. Shift to a fond, nostalgic tone for the father's bedtime reading memory. Speak confidently about being a bookworm. End with an inspiring call to action.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Magic of Reading (SBC)",
      topic: "Reading and Books",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a public library reading corner in Singapore. Several children are sitting on colourful cushions and low stools, absorbed in different books. One boy is reading a graphic novel with wide eyes, while a girl next to him has a thick chapter book open on her lap. Behind them, shelves are packed with books arranged by genre, with labels like 'Adventure', 'Science', and 'Folklore'. A librarian is setting up a display table with a sign reading 'Book Swap - Bring One, Take One'. Bright overhead lights and cheerful wall murals of storybook characters create an inviting atmosphere. A small sign reminds visitors: 'A reader today, a leader tomorrow.'",
      question1:
        "Describe what you see in this photograph. Why do you think the library has arranged the space this way?",
      question2:
        "What is a book that you have enjoyed reading recently? What made it special to you?",
      question3:
        "With so many videos and apps available today, do you think reading physical books is still important? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a public library reading corner in Singapore. Several children are sitting on colourful cushions and low stools, absorbed in different books. One boy is reading a graphic novel with wide eyes, while a girl next to him has a thick chapter book open on her lap. Behind them, shelves are packed with books arranged by genre, with labels like 'Adventure', 'Science', and 'Folklore'. A librarian is setting up a display table with a sign reading 'Book Swap - Bring One, Take One'. Bright overhead lights and cheerful wall murals of storybook characters create an inviting atmosphere. A small sign reminds visitors: 'A reader today, a leader tomorrow.'",
      imageSearchSuggestion:
        "children reading library cushions books Singapore public library kids corner",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 9: Animals and Responsibility (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "A Friend for Life",
      topic: "Animals and Responsibility",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "When my family adopted Biscuit from the SPCA two years ago, I had no idea how much a small, scruffy dog could change our lives. Biscuit had been abandoned by his previous owner and was found wandering the streets, hungry and afraid. His fur was matted, and he flinched whenever someone raised a hand, even if it was just to pat him.\n\nThe first few weeks were challenging. Biscuit hid under the sofa and refused to eat. My mother suggested we give him time and space. So every evening, I sat on the floor near him, reading my book quietly, letting him get used to my presence. Slowly, day by day, he inched closer. The first time he rested his head on my lap, I felt my heart swell with joy.\n\nToday, Biscuit greets me at the door every day after school, his tail wagging furiously. He has taught me that caring for an animal is a serious responsibility. It requires patience, commitment, and unconditional love. But the reward is a loyal companion who loves you with every fibre of his being. Adopting Biscuit was the best decision our family ever made.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To share a personal story about pet adoption and responsibility","audience":"Classmates during show-and-tell","context":"Adopting a rescue dog from the SPCA","tone":"Tender, honest, and heartfelt"}',
      readingTips:
        "Use a sad, sympathetic tone when describing Biscuit's past. Speak softly about the early days of building trust. Let your voice brighten as you describe the breakthrough moment. End warmly with conviction about responsibility.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "A Friend for Life (SBC)",
      topic: "Animals and Responsibility",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph taken at an animal shelter adoption drive in Singapore. A young boy is kneeling on the grass, gently stroking a small brown dog that is licking his face. Behind them, a row of temporary enclosures houses cats and dogs available for adoption, each with a name card and description attached. Volunteers wearing matching green T-shirts with the words 'Adopt, Don't Shop' are speaking to families who are visiting. A table displays pamphlets about responsible pet ownership. In the background, a banner reads 'Give Them a Second Chance - Adoption Day' with paw print decorations.",
      question1:
        "What event is taking place in this photograph? How can you tell that the boy has formed a connection with the dog?",
      question2:
        "Do you have a pet, or have you ever wanted one? What responsibilities come with caring for an animal?",
      question3:
        "Some people say that keeping animals as pets is selfish because animals should live freely in nature. Do you agree or disagree?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph taken at an animal shelter adoption drive in Singapore. A young boy is kneeling on the grass, gently stroking a small brown dog that is licking his face. Behind them, a row of temporary enclosures houses cats and dogs available for adoption, each with a name card and description attached. Volunteers wearing matching green T-shirts with the words 'Adopt, Don't Shop' are speaking to families who are visiting. A table displays pamphlets about responsible pet ownership. In the background, a banner reads 'Give Them a Second Chance - Adoption Day' with paw print decorations.",
      imageSearchSuggestion:
        "animal adoption drive boy dog SPCA Singapore pet shelter volunteer",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 10: Volunteering and Service (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Joy of Giving Back",
      topic: "Volunteering and Service",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Last December, my class volunteered at a community food distribution centre in Geylang. Our task was to pack and distribute food hampers to families in need. I arrived expecting a simple packing exercise, but what I experienced that day left a lasting impression on my heart.\n\nAs I handed a bag of rice and canned goods to an elderly man, he clasped my hands tightly and said, \"Thank you, child. You do not know how much this means to me.\" His gratitude was so sincere that I had to blink back tears. Behind him, a young mother carrying a toddler smiled quietly as she received her hamper. I noticed her shoes were worn and her bag was patched with tape.\n\nThat day, I realised how fortunate I was to have three meals a day without worrying about where they came from. I also understood that volunteering is not about feeling sorry for others. It is about recognising our shared humanity and doing our part to build a more compassionate society. Since then, I have signed up to volunteer every school holiday, because giving back gives me far more than I could ever give.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To reflect on a volunteering experience and inspire others to serve","audience":"School community during Values in Action presentation","context":"A food distribution volunteer event in Singapore","tone":"Humble, reflective, and inspiring"}',
      readingTips:
        "Begin calmly, setting the scene. Use a deeply grateful tone when voicing the elderly man. Pause for effect after emotional lines. Shift to a thoughtful, mature tone for the reflections. End with sincere conviction.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Joy of Giving Back (SBC)",
      topic: "Volunteering and Service",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a community food packing event at a void deck in Singapore. A group of primary school students in their school PE attire are working together to pack items into large bags. On the long table in front of them are stacks of rice, instant noodles, canned food, biscuits, and cooking oil. An adult volunteer with a clipboard is supervising the students. Some finished hampers are neatly stacked at the end of the table, each tied with a ribbon and a small card that reads 'With Love, From Your Neighbours'. A banner above reads 'Share-A-Meal Project'. In the background, a few elderly residents are seated on benches, waiting to receive their hampers.",
      question1:
        "What is happening in this photograph? Why do you think the organisers included a handwritten card with each hamper?",
      question2:
        "Have you ever taken part in a volunteering activity? Describe what you did and what you learnt from the experience.",
      question3:
        "Some people say that volunteering should be made compulsory for all students. Do you think this is a good idea? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a community food packing event at a void deck in Singapore. A group of primary school students in their school PE attire are working together to pack items into large bags. On the long table in front of them are stacks of rice, instant noodles, canned food, biscuits, and cooking oil. An adult volunteer with a clipboard is supervising the students. Some finished hampers are neatly stacked at the end of the table, each tied with a ribbon and a small card that reads 'With Love, From Your Neighbours'. A banner above reads 'Share-A-Meal Project'. In the background, a few elderly residents are seated on benches, waiting to receive their hampers.",
      imageSearchSuggestion:
        "students volunteering food packing community centre Singapore hampers elderly",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 11: Public Transport and Civic Behaviour (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "Graciousness on the Go",
      topic: "Public Transport and Civic Behaviour",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "The MRT was packed that morning, as it usually is during the rush hour. I squeezed through the crowd, clutching my school bag tightly to my chest, and managed to find a seat near the door. Just as I sat down, I noticed an elderly woman with a walking frame struggling to board the train. The doors were about to close.\n\nWithout thinking, I jumped up, pressed the door-open button, and helped her step safely inside. She thanked me breathlessly, and I offered her my seat. To my surprise, a man in a business suit who had been seated nearby stood up and offered his seat to a pregnant woman standing further along. It was as if one small act of kindness had sparked a chain reaction.\n\nWhen I arrived at school and told my form teacher, Mrs. Goh, about it, she smiled and said, \"Graciousness is contagious, Zhi Wei. One person can set the tone for an entire train carriage.\" That morning taught me that public transport is more than just a way to get from one place to another. It is a shared space where we practise patience, consideration, and the simple art of looking out for one another.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To recount an experience about graciousness on public transport","audience":"School newsletter readers","context":"A typical MRT ride during rush hour in Singapore","tone":"Lively, thoughtful, and uplifting"}',
      readingTips:
        "Set a bustling pace for the rush hour scene. Use urgency when describing the elderly woman boarding. Show warmth and surprise at the chain reaction. Deliver Mrs. Goh's quote with gentle wisdom. End reflectively.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Graciousness on the Go (SBC)",
      topic: "Public Transport and Civic Behaviour",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph taken inside a Singapore MRT train during a moderately crowded ride. A young student in school uniform is standing up and gesturing politely towards his seat, offering it to an elderly man carrying a bag of groceries. The elderly man is smiling gratefully and reaching for the handrail. Nearby, other passengers are looking on with approving expressions. Above the reserved seat, a sticker reads 'Priority Seat - Please offer to those who need it more'. Through the train window, the cityscape of HDB blocks and green trees is visible. The train interior is clean and well-lit.",
      question1:
        "What is the student doing in this photograph? Why do you think the other passengers are looking on with approval?",
      question2:
        "Tell me about a time when someone showed you kindness on public transport, or when you showed kindness to someone else.",
      question3:
        "Do you think people in Singapore are generally gracious on public transport? What more could be done to encourage better behaviour?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph taken inside a Singapore MRT train during a moderately crowded ride. A young student in school uniform is standing up and gesturing politely towards his seat, offering it to an elderly man carrying a bag of groceries. The elderly man is smiling gratefully and reaching for the handrail. Nearby, other passengers are looking on with approving expressions. Above the reserved seat, a sticker reads 'Priority Seat - Please offer to those who need it more'. Through the train window, the cityscape of HDB blocks and green trees is visible. The train interior is clean and well-lit.",
      imageSearchSuggestion:
        "Singapore MRT student offering seat elderly gracious priority seat public transport",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 12: Creativity and the Arts (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Power of Art",
      topic: "Creativity and the Arts",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "I used to think that art was just about drawing pretty pictures. That changed the day Ms. Ng, our art teacher, took our class to visit the National Gallery Singapore. As we wandered through the galleries, she stopped us in front of a painting by Georgette Chen showing a bustling market scene.\n\n\"What do you see?\" she asked. At first, we described the obvious: fruit, vegetables, people. But Ms. Ng pushed us deeper. \"Look at the colours. Look at the expressions. What story is the artist trying to tell?\" Gradually, the painting came alive. I saw the weariness on the vendor's face, the vibrant energy of the crowd, and the warmth of a community gathering.\n\nThat visit opened my eyes to the power of art. It is not merely decoration. Art tells stories, preserves history, and expresses emotions that words sometimes cannot capture. Since that trip, I have started sketching in a journal, capturing moments from my daily life. Whether it is a sunset over the HDB blocks or my cat napping on the windowsill, each sketch is my way of seeing the world more deeply and sharing that vision with others.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To share how a gallery visit changed the speaker\'s view of art","audience":"Classmates during a class presentation","context":"A school excursion to the National Gallery Singapore","tone":"Curious, reflective, and enthusiastic"}',
      readingTips:
        "Start with a casual, dismissive tone about art. Build curiosity when describing the gallery visit. Use Ms. Ng's questions with genuine inquiry. Let wonder grow in your voice. End passionately about the power of art.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Power of Art (SBC)",
      topic: "Creativity and the Arts",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a group of primary school students participating in an outdoor mural painting activity along a corridor of their school. Each student is painting a section of a large, colourful wall mural that depicts scenes of Singapore life: hawker centres, the Merlion, children playing at a playground, and a dragon boat race. Paint cans and brushes are spread on newspaper on the floor. A teacher is pointing at a section and giving guidance. Some students are wearing aprons splattered with paint. The partially completed mural is vibrant with greens, reds, blues, and yellows. A sign nearby reads 'Our Singapore Story - Painted by P6 Students'.",
      question1:
        "What are the students creating in this photograph? What scenes of Singapore life can you identify in the mural?",
      question2:
        "Do you enjoy any form of art, such as drawing, painting, music, or drama? Tell me about a time when you expressed your creativity.",
      question3:
        "Some people think that art and music should be given as much time as Mathematics and English in school. Do you agree? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a group of primary school students participating in an outdoor mural painting activity along a corridor of their school. Each student is painting a section of a large, colourful wall mural that depicts scenes of Singapore life: hawker centres, the Merlion, children playing at a playground, and a dragon boat race. Paint cans and brushes are spread on newspaper on the floor. A teacher is pointing at a section and giving guidance. Some students are wearing aprons splattered with paint. The partially completed mural is vibrant with greens, reds, blues, and yellows. A sign nearby reads 'Our Singapore Story - Painted by P6 Students'.",
      imageSearchSuggestion:
        "primary school students painting mural Singapore life art creativity school",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 13: Healthy Living and Exercise (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "Moving for a Better Life",
      topic: "Healthy Living and Exercise",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Six months ago, I could barely run two rounds around the school field without gasping for breath. I would collapse on the grass, red-faced and panting, while my classmates jogged effortlessly past me. Physical education was my least favourite subject, and I dreaded every single lesson.\n\nThen my father challenged me. \"Let us start jogging together every morning,\" he said. \"Just fifteen minutes. No pressure.\" Reluctantly, I agreed. The first few mornings were torture. My legs ached, my lungs burned, and I wanted to quit after the first lamppost. But my father ran beside me, encouraging me gently. \"One more step,\" he would say. \"Just one more.\"\n\nWeek by week, those fifteen minutes grew to twenty, then thirty. My stamina improved. I slept better at night. I felt more alert during lessons and even my mood lifted. By the third month, I completed the school's two-point-four-kilometre run without stopping for the first time in my life. The look of pride on my father's face was worth every agonising morning. Exercise has taught me that our bodies are capable of far more than our minds believe. All it takes is the courage to start and the discipline to keep going.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To share a personal fitness journey and encourage exercise","audience":"Classmates during a health and wellness week assembly","context":"A father-child morning jogging routine","tone":"Honest, determined, and motivational"}',
      readingTips:
        "Express physical exhaustion at the start. Voice the father's encouragement gently but firmly. Build momentum as the narrator improves. Deliver the final reflection with pride and confidence.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Moving for a Better Life (SBC)",
      topic: "Healthy Living and Exercise",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a park connector in Singapore early in the morning. A father and his primary-school-aged son are jogging side by side along a tree-lined path. Both are wearing sports attire and running shoes. The son looks determined, his face slightly flushed with effort, while the father gives him a thumbs-up of encouragement. Behind them, other residents are exercising: an elderly couple is practising tai chi on the grass, and a woman is walking her dog. A distance marker on the path reads '2 km'. The sky is a soft orange-pink of dawn, and the greenery around the path is lush. A water fountain and a park bench are visible nearby.",
      question1:
        "Describe what you see in this photograph. What tells you that the father and son make exercise a regular habit?",
      question2:
        "What kind of physical activity do you enjoy? How often do you exercise, and how does it make you feel?",
      question3:
        "Do you think schools should have physical education lessons every day instead of just twice a week? Give reasons for your view.",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a park connector in Singapore early in the morning. A father and his primary-school-aged son are jogging side by side along a tree-lined path. Both are wearing sports attire and running shoes. The son looks determined, his face slightly flushed with effort, while the father gives him a thumbs-up of encouragement. Behind them, other residents are exercising: an elderly couple is practising tai chi on the grass, and a woman is walking her dog. A distance marker on the path reads '2 km'. The sky is a soft orange-pink of dawn, and the greenery around the path is lush. A water fountain and a park bench are visible nearby.",
      imageSearchSuggestion:
        "father son jogging park connector morning exercise Singapore healthy living",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 14: Safety and Road Awareness (Intermediate, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "A Close Call at the Crossing",
      topic: "Safety and Road Awareness",
      difficulty: "Intermediate",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "It happened so fast that I still shudder when I think about it. Last Tuesday, my younger brother Ethan and I were walking home from school. We reached the pedestrian crossing near our estate, and the green man appeared on the signal. Ethan, eager to get home and watch his favourite cartoon, dashed forward without looking.\n\nA delivery motorcycle that had run the red light came hurtling around the corner. Time seemed to freeze. I grabbed Ethan's school bag and yanked him backwards with all my strength. The motorcycle missed him by mere centimetres, its engine roaring as it sped away. Ethan stood on the kerb, trembling, his face white with shock.\n\n\"Always look left, right, and left again,\" I told him firmly, my own voice shaking. \"Even when the light is green. Not every driver follows the rules.\" That evening, our parents sat us both down for a serious talk about road safety. They reminded us to use pedestrian overhead bridges whenever possible and to never assume that vehicles will stop. It was a close call that we were lucky to walk away from, and it is a lesson I will never forget.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To recount a road safety incident and warn others","audience":"Classmates during a road safety assembly","context":"A near-accident at a pedestrian crossing in Singapore","tone":"Tense, urgent, and cautionary"}',
      readingTips:
        "Create tension and urgency as the scene unfolds. Speed up slightly at the moment of danger. Use a shaky, relieved voice after the near-miss. Deliver the safety reminders firmly and seriously.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "A Close Call at the Crossing (SBC)",
      topic: "Safety and Road Awareness",
      difficulty: "Intermediate",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a pedestrian crossing near a primary school in Singapore. A group of young students wearing school uniforms with reflective sashes are crossing the road in an orderly line. A traffic warden in a bright orange vest is holding up a stop sign to halt traffic. Cars and a bus are waiting at the red light. On the pavement, a yellow sign reads 'School Zone - Slow Down'. Road markings are clearly visible, including zebra stripes and a speed bump. In the background, the school gate and a large sign with the school name are visible. Some parents are standing near the gate, watching their children cross safely.",
      question1:
        "What safety measures can you see in this photograph that help to protect the students? Why do you think they are important?",
      question2:
        "How do you stay safe when crossing roads near your school or home? Describe the steps you take.",
      question3:
        "Some people suggest that all roads near schools should be car-free zones during school hours. Do you think this is practical? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a pedestrian crossing near a primary school in Singapore. A group of young students wearing school uniforms with reflective sashes are crossing the road in an orderly line. A traffic warden in a bright orange vest is holding up a stop sign to halt traffic. Cars and a bus are waiting at the red light. On the pavement, a yellow sign reads 'School Zone - Slow Down'. Road markings are clearly visible, including zebra stripes and a speed bump. In the background, the school gate and a large sign with the school name are visible. Some parents are standing near the gate, watching their children cross safely.",
      imageSearchSuggestion:
        "Singapore school zone pedestrian crossing students traffic warden safety road",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 15: School Life and Friendship (Advanced, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Friend Who Changed Everything",
      topic: "School Life and Friendship",
      difficulty: "Advanced",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "When Kai Wen transferred to our school at the start of Primary Five, nobody paid him much attention. He was quiet, kept to himself, and always ate alone at the corner table in the canteen. Most of my classmates dismissed him as unfriendly. I might have done the same, if not for what happened during our group project.\n\nWe were assigned to the same team, and I quickly discovered that Kai Wen was anything but unfriendly. He was shy, yes, but also incredibly thoughtful. While the rest of us argued about who would do what, Kai Wen quietly completed the research, designed the slides, and even brought homemade cookies for the group. When I thanked him, he looked surprised, as if he was not used to being appreciated.\n\nOver the next few months, Kai Wen and I became close friends. He taught me origami, introduced me to astronomy, and showed me that the quietest people often have the richest inner worlds. In return, I helped him come out of his shell, introducing him to our wider group of friends. Our friendship taught me a valuable lesson: never judge someone before you truly know them. The best friendships often bloom in the most unexpected places.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To share how an unexpected friendship formed and its lessons","audience":"Classmates and teachers at a graduation assembly","context":"A new student joining the class in primary school","tone":"Genuine, warm, and insightful"}',
      readingTips:
        "Use a neutral, slightly indifferent tone when describing Kai Wen initially. Show surprise and admiration when revealing his true character. Warm your voice progressively as the friendship develops. Deliver the final lesson with sincerity.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Friend Who Changed Everything (SBC)",
      topic: "School Life and Friendship",
      difficulty: "Advanced",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a school canteen during recess. Two boys are sitting at a table, one showing the other how to fold an origami crane. The table has their lunch trays with half-eaten food and a stack of colourful origami paper. Around them, other students are eating and chatting in groups. One of the boys looks confident and animated while the other appears more reserved but is smiling as he follows the folding instructions. On the wall behind them, a bulletin board displays a poster reading 'Be a Buddy, Not a Bully - Friendship Week'. School bags are hung on hooks beside the table. The canteen is bright and bustling with activity.",
      question1:
        "What can you tell about the relationship between the two boys in this photograph? What details support your answer?",
      question2:
        "Think about your closest friend at school. How did your friendship begin, and what makes it special?",
      question3:
        "Do you think schools do enough to help new students make friends and settle in? What else could be done?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a school canteen during recess. Two boys are sitting at a table, one showing the other how to fold an origami crane. The table has their lunch trays with half-eaten food and a stack of colourful origami paper. Around them, other students are eating and chatting in groups. One of the boys looks confident and animated while the other appears more reserved but is smiling as he follows the folding instructions. On the wall behind them, a bulletin board displays a poster reading 'Be a Buddy, Not a Bully - Friendship Week'. School bags are hung on hooks beside the table. The canteen is bright and bustling with activity.",
      imageSearchSuggestion:
        "school canteen two boys origami friendship recess Singapore primary school",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 16: Money and Financial Literacy (Advanced, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Piggy Bank Lesson",
      topic: "Money and Financial Literacy",
      difficulty: "Advanced",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "I will never forget the day I smashed open my piggy bank and discovered that six months of saving had only amounted to forty-seven dollars and thirty cents. I had set my sights on a remote-controlled drone that cost one hundred and twenty dollars, and the reality of how far away my goal was hit me like a cold splash of water.\n\nMy mother saw the disappointment on my face and sat me down at the kitchen table. \"Let me show you something,\" she said, pulling out a notebook. Together, we tracked my spending for the past month. I was stunned. I had spent over thirty dollars on bubble tea, snacks from the school bookshop, and capsule toy machines without even realising it.\n\n\"Money has a way of disappearing when you are not paying attention,\" my mother explained. She taught me the 50-30-20 rule: fifty per cent of my allowance for needs, thirty per cent for wants, and twenty per cent for savings. It sounded strict at first, but within three months, my savings had tripled. I finally bought that drone, and it felt incredibly rewarding because I had earned it through discipline. That experience taught me that financial literacy is not just for adults. The habits we build now will shape the way we manage money for the rest of our lives.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To share a personal lesson about saving money and budgeting","audience":"Classmates during a financial literacy week talk","context":"A child learning to manage pocket money in Singapore","tone":"Honest, self-aware, and educational"}',
      readingTips:
        "Express genuine disappointment when opening the piggy bank. Use a patient, wise tone for the mother's dialogue. Show surprise at the spending revelation. End with pride and a firm, instructive delivery about financial discipline.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Piggy Bank Lesson (SBC)",
      topic: "Money and Financial Literacy",
      difficulty: "Advanced",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a classroom activity about financial literacy. A teacher is standing at the front holding a large chart labelled 'My Budget Plan' with columns for 'Needs', 'Wants', and 'Savings'. Students at their desks have play money, calculators, and worksheets. One student in the foreground is carefully sorting colourful play dollar notes into three labelled envelopes. Another student is using a calculator with a concentrated expression. On the whiteboard behind the teacher, there are drawings of a piggy bank, a shopping cart, and a savings jar with coins. A banner above reads 'Financial Literacy Week'. The classroom is tidy and well-organised with students engaged in the activity.",
      question1:
        "What lesson do you think the students are learning in this photograph? How can you tell they are engaged in the activity?",
      question2:
        "How do you manage your pocket money or allowance? Do you save, spend, or do both?",
      question3:
        "Do you think children should be taught about money management in school? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a classroom activity about financial literacy. A teacher is standing at the front holding a large chart labelled 'My Budget Plan' with columns for 'Needs', 'Wants', and 'Savings'. Students at their desks have play money, calculators, and worksheets. One student in the foreground is carefully sorting colourful play dollar notes into three labelled envelopes. Another student is using a calculator with a concentrated expression. On the whiteboard behind the teacher, there are drawings of a piggy bank, a shopping cart, and a savings jar with coins. A banner above reads 'Financial Literacy Week'. The classroom is tidy and well-organised with students engaged in the activity.",
      imageSearchSuggestion:
        "primary school financial literacy classroom budget money management students Singapore",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 17: Climate Change and Nature (Advanced, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "Our Warming World",
      topic: "Climate Change and Nature",
      difficulty: "Advanced",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Dear Editor, I am writing to express my growing concern about the effects of climate change on our small island nation. Last year, Singapore experienced its warmest recorded year, with temperatures soaring to nearly thirty-seven degrees Celsius. Flash floods disrupted roads in Bukit Timah and Orchard Road, and the haze from regional forest fires left many of us struggling to breathe.\n\nAs a Primary Six student, I may be young, but I understand that the choices we make today will determine the kind of world my generation inherits. Scientists warn that rising sea levels could threaten low-lying countries like ours within the next few decades. The coral reefs around our southern islands are bleaching at an alarming rate, and wildlife habitats are shrinking.\n\nHowever, I refuse to feel hopeless. I believe that every person, no matter how young, can contribute to the solution. We can reduce our use of single-use plastics, conserve electricity by switching off appliances when not in use, and support local farms to reduce food miles. Climate change is not a distant problem for future generations to solve. It is happening right now, and it demands action from every single one of us.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To persuade readers to take climate change seriously","audience":"Newspaper readers via a letter to the editor","context":"Climate change impacts on Singapore","tone":"Concerned, informed, and urgent"}',
      readingTips:
        "Open with formal gravity appropriate for a letter to the editor. Use alarming emphasis on the temperature and flood statistics. Shift from concern to determination when refusing to feel hopeless. End with a rallying, urgent call to action.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Our Warming World (SBC)",
      topic: "Climate Change and Nature",
      difficulty: "Advanced",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A striking photograph showing the contrast between nature and urbanisation in Singapore. In the foreground, a lush mangrove area at Sungei Buloh Wetland Reserve is teeming with life: birds perch on branches, mudskippers hop along the mudflats, and green mangrove roots reach into the water. In the background, the skyline of industrial buildings and construction cranes is visible across the strait. A wooden boardwalk runs through the mangrove, and a group of students with clipboards are taking notes as part of a nature study. An information board near the boardwalk shows facts about rising sea levels and their impact on coastal ecosystems. The sky is overcast with heavy grey clouds.",
      question1:
        "What contrast do you notice between the foreground and background of this photograph? What message do you think this contrast sends?",
      question2:
        "What is one thing you or your family do at home to help the environment? How effective do you think it is?",
      question3:
        "Some people argue that economic development should take priority over environmental protection. Do you agree? Give reasons for your answer.",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A striking photograph showing the contrast between nature and urbanisation in Singapore. In the foreground, a lush mangrove area at Sungei Buloh Wetland Reserve is teeming with life: birds perch on branches, mudskippers hop along the mudflats, and green mangrove roots reach into the water. In the background, the skyline of industrial buildings and construction cranes is visible across the strait. A wooden boardwalk runs through the mangrove, and a group of students with clipboards are taking notes as part of a nature study. An information board near the boardwalk shows facts about rising sea levels and their impact on coastal ecosystems. The sky is overcast with heavy grey clouds.",
      imageSearchSuggestion:
        "Sungei Buloh mangrove Singapore nature urban contrast climate change wetland students",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 18: Food Waste and Responsibility (Advanced, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "The Cost of Wasted Food",
      topic: "Food Waste and Responsibility",
      difficulty: "Advanced",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "I was queuing at the school canteen when I noticed something disturbing. The boy in front of me scraped nearly half his plate of rice and vegetables into the bin without a second thought. I looked around and saw similar scenes at almost every table: untouched fruit, half-eaten sandwiches, and full bowls of soup being dumped carelessly.\n\nAccording to the National Environment Agency, Singapore generates over eight hundred thousand tonnes of food waste every year. That is enough to fill more than a thousand Olympic swimming pools. What makes this even more troubling is that Singapore imports over ninety per cent of its food. We are throwing away precious resources that we do not even produce ourselves.\n\nAfter learning these facts in class, our school started a \"Clean Plate Campaign\". Students were encouraged to take only what they could finish and to try every dish before discarding it. The results were remarkable. Within a month, our canteen's food waste dropped by thirty per cent. I learnt that reducing food waste does not require drastic changes. It starts with something as simple as being mindful of how much we put on our plates. Every grain of rice matters, and every piece of food saved is a step towards a more sustainable future.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To raise awareness about food waste in Singapore","audience":"School community at an assembly","context":"A school campaign to reduce canteen food waste","tone":"Concerned, factual, and motivational"}',
      readingTips:
        "Express mild shock and disapproval when describing the wasted food. Deliver the statistics with emphasis and clarity. Use an encouraging tone when discussing the campaign results. End with a hopeful, determined voice.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "The Cost of Wasted Food (SBC)",
      topic: "Food Waste and Responsibility",
      difficulty: "Advanced",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph of a school canteen in Singapore focusing on a tray return station. Several trays with leftover food are stacked on the counter: half-eaten bowls of noodles, untouched vegetables, and a nearly full plate of rice. A student volunteer wearing a sash reading 'Food Waste Ambassador' is standing beside a large chart that tracks the school's weekly food waste in kilograms. The chart shows a downward trend over the past month. Next to the counter, there is a compost bin with a sign explaining how food scraps are turned into fertiliser for the school garden. In the background, students are eating at tables, and a poster on the wall reads 'Take Only What You Need - Clean Plate Challenge'.",
      question1:
        "What clues in this photograph tell you that the school is trying to reduce food waste? Do you think their efforts are working?",
      question2:
        "Do you finish all the food on your plate at home and in school? What happens to the food you do not finish?",
      question3:
        "Should schools be allowed to punish students who repeatedly waste food? What do you think would be a fair approach?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph of a school canteen in Singapore focusing on a tray return station. Several trays with leftover food are stacked on the counter: half-eaten bowls of noodles, untouched vegetables, and a nearly full plate of rice. A student volunteer wearing a sash reading 'Food Waste Ambassador' is standing beside a large chart that tracks the school's weekly food waste in kilograms. The chart shows a downward trend over the past month. Next to the counter, there is a compost bin with a sign explaining how food scraps are turned into fertiliser for the school garden. In the background, students are eating at tables, and a poster on the wall reads 'Take Only What You Need - Clean Plate Challenge'.",
      imageSearchSuggestion:
        "school canteen food waste tray return Singapore clean plate campaign compost",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 19: Home and Family (Advanced, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "What Home Means to Me",
      topic: "Home and Family",
      difficulty: "Advanced",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Home. It is a small word, but it holds a universe of meaning. For me, home is not just the four walls of our three-room flat in Tampines. It is the sound of my father humming Tamil songs while he cooks dinner. It is the warmth of my mother's hand on my forehead when I am unwell. It is my sister's laughter ringing through the corridor as she chases our cat around the living room.\n\nWe may not live in a big house with a swimming pool. Our flat is modest, and we share a bedroom, my sister and I. But every evening, when the four of us gather around our small dining table, eating simple home-cooked food and talking about our day, I feel richer than anyone in the world.\n\nLast Deepavali, my father lost his job unexpectedly. For weeks, I noticed my parents whispering in the kitchen late at night, worry etched on their faces. Yet they never let it affect us. My mother picked up extra shifts at the clinic, and my father took on part-time work while searching for a new position. They showed me that a family's strength is not measured by its wealth but by the love and resilience that hold it together. Home is wherever my family is, and that is the greatest blessing I know.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To express what home and family truly mean","audience":"Classmates during an English oral presentation","context":"A personal reflection on family life in an HDB flat","tone":"Intimate, loving, and deeply heartfelt"}',
      readingTips:
        "Open with a quiet, contemplative pause after the word 'Home'. Use sensory, warm descriptions. Lower your voice slightly when describing the father's job loss. Show admiration when speaking about the parents' resilience. End with deep feeling.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "What Home Means to Me (SBC)",
      topic: "Home and Family",
      difficulty: "Advanced",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A warm photograph of a family of four having dinner together in their HDB flat. The father is serving curry from a pot onto plates while the mother pours drinks. Two children, a boy and a girl around ten to twelve years old, are seated at the table smiling. The table is set simply with rice, a vegetable dish, and a bowl of soup. The flat is modest but tidy, with family photographs on the wall, school bags hanging on hooks, and a small television in the background. Warm yellow light from a ceiling lamp creates a cosy atmosphere. Through the kitchen window, the lights of neighbouring HDB blocks twinkle in the evening sky.",
      question1:
        "What do you notice about the atmosphere in this photograph? What details suggest that this family is close?",
      question2:
        "Describe a typical evening meal with your family. What do you enjoy most about spending time together at home?",
      question3:
        "In Singapore, many families live in small flats. Do you think the size of a home affects how happy a family can be? Explain your view.",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A warm photograph of a family of four having dinner together in their HDB flat. The father is serving curry from a pot onto plates while the mother pours drinks. Two children, a boy and a girl around ten to twelve years old, are seated at the table smiling. The table is set simply with rice, a vegetable dish, and a bowl of soup. The flat is modest but tidy, with family photographs on the wall, school bags hanging on hooks, and a small television in the background. Warm yellow light from a ceiling lamp creates a cosy atmosphere. Through the kitchen window, the lights of neighbouring HDB blocks twinkle in the evening sky.",
      imageSearchSuggestion:
        "Singapore HDB family dinner together home cosy flat evening meal",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ============================================================
    // Theme 20: Gratitude and Privilege (Advanced, isDaily: false)
    // ============================================================
    {
      type: "READING",
      title: "Counting Our Blessings",
      topic: "Gratitude and Privilege",
      difficulty: "Advanced",
      preambleText: "Read the following passage aloud clearly and expressively.",
      passageText:
        "Last month, our school organised a trip to a children's home as part of our Values in Action programme. I went expecting to cheer the children up. Instead, they ended up teaching me one of the most important lessons of my life.\n\nThe children at the home did not have many material possessions. Their clothes were simple, their toys were few, and they shared bedrooms with five or six others. Yet what struck me was how happy they seemed. They laughed freely, played together with boundless energy, and welcomed us with the warmest smiles I had ever seen. A girl named Sarah, who was about my age, showed me a drawing she had made of her dream house. \"One day,\" she said with sparkling eyes, \"I will build this for my family.\"\n\nOn the bus ride home, I sat in silence, looking out the window at the world I had always taken for granted: my own bedroom, three meals a day, a school bag full of textbooks, parents who drove me to tuition. For the first time, I truly understood the meaning of privilege. Gratitude is not just saying thank you. It is recognising how fortunate we are and using that awareness to be kinder, more generous, and more compassionate towards those who have less.",
      posterImageResName: "",
      posterDescription: "",
      question1: "",
      question2: "",
      question3: "",
      isDaily: false,
      preamblePact:
        '{"purpose":"To reflect on gratitude and privilege after visiting a children\'s home","audience":"School community at an end-of-year reflection assembly","context":"A Values in Action visit to a children\'s home in Singapore","tone":"Thoughtful, humbled, and deeply reflective"}',
      readingTips:
        "Begin with expectation and confidence. Use a warm, surprised tone when describing the children's happiness. Voice Sarah's words with innocent hope. Grow quiet and reflective on the bus ride home. Deliver the closing message with weight and sincerity.",
      photographDescription: "",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "Counting Our Blessings (SBC)",
      topic: "Gratitude and Privilege",
      difficulty: "Advanced",
      preambleText:
        "Look at the photograph below and answer the questions that follow.",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "A photograph taken during a school visit to a children's home in Singapore. A group of primary school students are seated on the floor in a circle with children from the home, playing a board game together. The students are wearing their school PE attire, and the home's children are in casual clothes. Everyone is laughing and engaged. Behind them, a simply furnished common room has a bookshelf with well-worn books, a few soft toys on a shelf, and children's artwork pinned to a corkboard. One piece of artwork shows a crayon drawing of a house with the words 'My Dream Home' written underneath. A caretaker stands in the doorway, watching with a gentle smile. The room is clean but sparse, with fluorescent lighting overhead.",
      question1:
        "What can you infer about the children's home from the details in this photograph? How do the visiting students and the home's children seem to be getting along?",
      question2:
        "Think about something you have that you often take for granted. What is it, and why are you grateful for it?",
      question3:
        "Do you believe that happiness depends on having many material things? Why or why not?",
      isDaily: false,
      preamblePact: "",
      readingTips: "",
      photographDescription:
        "A photograph taken during a school visit to a children's home in Singapore. A group of primary school students are seated on the floor in a circle with children from the home, playing a board game together. The students are wearing their school PE attire, and the home's children are in casual clothes. Everyone is laughing and engaged. Behind them, a simply furnished common room has a bookshelf with well-worn books, a few soft toys on a shelf, and children's artwork pinned to a corkboard. One piece of artwork shows a crayon drawing of a house with the words 'My Dream Home' written underneath. A caretaker stands in the doorway, watching with a gentle smile. The room is clean but sparse, with fluorescent lighting overhead.",
      imageSearchSuggestion:
        "school visit children home Singapore students playing together VIA programme",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },
  ];
}
