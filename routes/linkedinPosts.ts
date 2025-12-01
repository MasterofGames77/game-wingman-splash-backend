import { Request, Response, Router } from 'express';
import { LinkedInSeries, LinkedInPost } from '../types';

const router = Router();

/**
 * LinkedIn Posts Data
 * 
 * TODO: Populate with actual post content
 * This will contain:
 * - Series 1: Challenging Parts/Levels/Moments (10 posts)
 * - Series 2: 100% Completion Chronicles (10 posts)
 */
const LINKEDIN_POSTS: Record<string, LinkedInSeries> = {
  challenging: {
    seriesId: 'challenging',
    seriesTitle: 'Challenging Parts/Levels/Moments',
    seriesDescription: 'Exploring the most difficult and memorable challenges in video games',
    introPost: {
      id: 0, // Intro posts use id: 0
      title: 'Introducing the "Toughest Levels in Gaming" Series',
      content: `🎮 Introducing the "Toughest Levels in Gaming" Series

Why We Play — and Why We Don't Give Up

Every gamer knows that moment — the boss fight or level that stops you in your tracks.

Your heart's pounding, palms are sweaty, and you've said, "Just one more try," at least 50 times.

But it's in those moments — the ones that test our patience, focus, and resilience — that gaming truly shines.

Over the next few weeks, I'll be sharing a 10-part series diving into some of the most difficult games and levels ever made — from Dark Souls' Ornstein & Smough to Celeste's Farewell.

Each post will break down:

🎯 The challenge and why it's so tough

📊 A difficulty rating (0–10) and estimated completion rate

🤖 The "Wingman-boosted" success rate

💡 The Video Game Wingman strategies that help players push through`,
      linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-gaming-gamedifficulty-activity-7381114538542125056-Z9bW?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
      publishedDate: '2025-10-06',
      hashtags: [
        '#VideoGameWingman',
        '#Gaming',
        '#GameDifficulty',
        '#GameDevelopment',
        '#GamingMotivation',
      ],
    },
    posts: [
      // Post 10 - Devil May Cry 3: Vergil
      {
        id: 10,
        title: 'Final Day (10) of the Toughest Game Series: Devil May Cry 3: Dante\'s Awakening - Vergil Boss Fight',
        content: `Final Day (10) of the Toughest Game Series:

Devil May Cry 3: Dante's Awakening - Vergil Boss Fight

A Duel Between Brothers, and Between Mastery and Ego:

There are boss fights — and then there's Dante vs. Vergil.

It's not just one of the most iconic moments in Devil May Cry history - it's one of the most skill-based, emotionally charged rival battles ever created.

Every clash of blades feels personal.

Every dodge is a conversation.

Every mistake is punished instantly.

Vergil isn't just another boss. He's you — faster, sharper, and more disciplined.

To win, you can't just mash buttons. You have to think, react, and move with intent - like you're fighting your own reflection.

🎯 Difficulty Breakdown:

Difficulty Rating: 9.5 / 10

Average Completion Rate: ~25% (estimated)

Completion Rate with Video Game Wingman: ~83%

Roughly one in four players can defeat Vergil unaided — and even fewer do it stylishly.

But with Video Game Wingman, players aren't just surviving the fight — they're dominating it.

🧠 How Video Game Wingman Sharpens Precision and Style:

The Vergil fight is a masterclass in control and timing. It rewards calm decision-making and punishes impulsiveness - a perfect match for Video Game Wingman's analytical coaching.

✅ Reaction Pattern Recognition: Tracks Vergil's attack telegraphs and trains players to identify counter windows instead of reacting on instinct.

✅ Combo Optimization Analysis: Evaluates player attack sequences and recommends smoother, faster combos to maintain pressure without losing rhythm.

✅ Parry and Dodge Timing Visualizer: Provides frame-by-frame rhythm cues for evading Judgment Cuts and teleport combos.

✅ Emotional Flow Coaching: Teaches how to stay composed and confident under high-tempo combat - where panic usually leads to failure.

Wingman helps players develop not just skill, but style.

Because in Devil May Cry, victory isn't enough - it has to look effortless.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-devilmaycry-capcom-activity-7386461947824709633-wZu2?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Devil May Cry 3',
        gameTitle: 'Devil May Cry 3: Dante\'s Awakening',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post10-devil-may-cry-vergil_bAI0mekd_.png',
        publishedDate: '2025-10-21',
        hashtags: [
          '#VideoGameWingman',
          '#DevilMayCry',
          '#Capcom',
          '#GameDifficulty',
          '#BossFights',
          '#AIInGaming',
          '#PrecisionMatters',
        ],
        metadata: {
          seriesDay: 10,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '9.5 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~25%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~83%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 9 - Getting Over It
      {
        id: 9,
        title: 'Day 9 of the Toughest Game Series: Getting Over It with Bennett Foddy – Rage and Resilience',
        content: `Day 9 of the Toughest Game Series:

Getting Over It with Bennett Foddy – Rage and Resilience

When Falling Is Part of the Climb:

Few games are as infamous — or as humbling — as Getting Over It with Bennett Foddy.

Armed with nothing but a hammer, a cauldron, and sheer willpower, you're asked to climb a surreal mountain where one wrong swing can erase an hour of progress. And then it happens.

You slip, you fall, you scream.

And somewhere in the background, Bennett Foddy calmly says,

"Getting over it is all a matter of patience."

That's when most players quit.

But for those who persist, Getting Over It becomes something else entirely - not a game about climbing, but a lesson in emotional control and resilience.

Difficulty Breakdown:

Difficulty Rating: 9 / 10

Average Completion Rate: ~8%

Completion Rate with Video Game Wingman: ~68%

Fewer than 1 in 10 players ever reach the summit.

But with Video Game Wingman's guidance, nearly 7 in 10 do — not because the mountain changes, but because the mindset does.

🧠 How Video Game Wingman Helps You Climb Higher:

Video Game Wingman understands that the true challenge of Getting Over It isn't mechanical — it's mental.

✅ Emotional Control Coaching: Detects frustration patterns in player performance and recommends brief "reset intervals" to prevent tilt and burnout.

✅ Grip Momentum Prediction: Analyzes mouse input velocity and hammer swing angles to forecast when a player might overcommit - helping refine precision and control.

✅ Micro-Adjustment Analysis: Breaks down each failed segment into replay snippets showing subtle technique improvements, turning failure into feedback.

✅ Mindset Reinforcement: Offers personalized motivational feedback when progress slows, reframing setbacks as part of the learning curve.

Wingman turns rage into reflection - and teaches that every fall is data, not defeat.

Getting Over It is more than a game. It's a mirror.

It reflects your patience, your discipline, and your ability to stay calm when everything literally comes crashing down.

💬 Question for you: What's a game (or real-life moment) that taught you to keep your cool when everything went wrong?`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-gettingoverit-gamedifficulty-activity-7386116129334767618-_HeM?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Getting Over It with Bennett Foddy',
        gameTitle: 'Getting Over It with Bennett Foddy',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post9-getting-over-it_T4GQZlXf3.png',
        publishedDate: '2025-10-20',
        hashtags: [
          '#VideoGameWingman',
          '#GettingOverIt',
          '#GameDifficulty',
          '#AIInGaming',
          '#GamingResiliance',
        ],
        metadata: {
          seriesDay: 9,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '9 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~8%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~68%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 8 - Majora's Mask
      {
        id: 8,
        title: 'Day 8 of the Toughest Game Series: The Legend of Zelda: Majora\'s Mask – Great Bay Temple',
        content: `Day 8 of the Toughest Game Series:

The Legend of Zelda: Majora's Mask – Great Bay Temple

A Battle Against Time and Turbulence:

If you've ever ventured into The Great Bay Temple, you know it's not just a dungeon - it's a mental maze under pressure.

In Majora's Mask, time is your greatest enemy. The moon is falling, the clock is ticking, you only have 3 in-game days (54 minutes in real time) before its Game Over. And then there is the temple itself.

The Great Bay Temple takes everything the infamous Water Temple from Ocarina of Time did - and turns the complexity up several notches.

Instead of toggling water levels, you're manipulating a massive, interconnected system of water currents that all flow through one giant mechanical ecosystem. Change one valve, and half the dungeon's layout changes with it.

It's less about memorization - and more about systems thinking under stress.

🎯 Difficulty Breakdown:

Difficulty Rating: 8.5 / 10

Average Completion Rate: ~45% (estimated)

Completion Rate with Video Game Wingman: ~87%

Nearly half of players stall or abandon the Great Bay Temple before completion - often due to time pressure and spatial confusion.

But with Video Game Wingman's guidance, that number jumps dramatically, as the assistant helps players break the puzzle down into manageable patterns instead of panic.

🧠 How Video Game Wingman Helps Players Navigate the Flow:

The Great Bay Temple isn't about fighting enemies - it's about understanding a living mechanism. And that's exactly where Video Game Wingman excels.

✅ Water Flow Visualization: Creates an interactive map showing how valve switches redirect current, helping players predict outcomes before pulling the lever.

✅ Route Optimization: Suggests the most efficient path through the temple to minimize backtracking - especially vital when the in-game clock is running down.

✅ Time Management Coaching: Advises when to slow or reset the 3-day cycle using the Inverted Song of Time to balance exploration with survival.

✅ Zora Form Mastery: Offers swimming control practice and momentum management drills to help players stay precise in fast-moving current zones.

Wingman helps players zoom out — literally and mentally — transforming confusion into comprehension.

The Great Bay Temple is one of Nintendo's most ambitious dungeon designs - a labyrinth that tests your patience, planning, and ability to think systemically under pressure.

It's not just about beating the clock - it's about understanding cause and effect.

Every switch matters. Every current has purpose. Every second counts.

And that's where Video Game Wingman thrives - guiding players through complexity with clarity, focus, and confidence.

Because in games and in life, the key to solving big problems isn't rushing through them… it's learning how to manage the flow.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-thelegendofzelda-majorasmask-activity-7385002241914732544-xk1X?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'The Legend of Zelda: Majora\'s Mask',
        gameTitle: 'The Legend of Zelda: Majora\'s Mask',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post8-zelda-majoras-mask-great-bay_5whigE88E.png',
        publishedDate: '2025-10-17',
        hashtags: [
          '#VideoGameWingman',
          '#TheLegendofZelda',
          '#MajorasMask',
          '#Nintendo',
          '#GameDifficulty',
          '#AIInGaming',
          '#PuzzleSolving',
        ],
        metadata: {
          seriesDay: 8,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '8.5 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~45%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~87%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 7 - Hollow Knight
      {
        id: 7,
        title: 'Day 7 of the Toughest Game Series: Hollow Knight: Pantheon of Hallownest - The 42-Boss Marathon',
        content: `Day 7 of the Toughest Game Series:

Hollow Knight: Pantheon of Hallownest - The 42-Boss Marathon

Endurance Meets Elegance:

Hollow Knight is a game that rewards precision, patience, and perseverance.

But for those who dare to face its ultimate challenge - the Pantheon of Hallownest - it becomes something else entirely.

A 42-boss marathon.

No checkpoints. No breaks. Just focus, endurance, and the will to push forward for nearly an hour without slipping once.

It's not just about skill - it's about mental stamina. Every dodge, slash, and heal must be deliberate. Every second demands attention.

🎯 Difficulty Breakdown

Difficulty Rating: 10 / 10

Average Completion Rate: ~12%

Completion Rate with Video Game Wingman: ~75%

Only about one in ten players ever finish the Pantheon of Hallownest on their own.

But with Video Game Wingman's assistance, nearly three out of four reach the end - not because the bosses get easier, but because the player becomes more composed, more efficient, and more strategic.

🧠 How Video Game Wingman Helps Players Master the Marathon:

This isn't a test of mechanics - it's a test of mindset.

Video Game Wingman analyzes not just gameplay performance, but mental performance, helping players pace themselves through one of the most demanding gauntlets in gaming.

✅ Route Prioritization: Identifies which boss patterns tend to drain player focus and helps reorder practice runs for optimal mental recovery.

✅ Charm Combination Optimization: Suggests loadouts that balance survivability and damage output, tailored to player tendencies and reflex timing.

✅ Performance Analytics: Tracks reaction consistency, average hit windows, and recovery times to pinpoint fatigue moments.

✅ Mental Endurance Coaching: Provides focus cues, breathing prompts, and micro-break timing to sustain sharpness over extended fights.

Wingman helps players build a rhythm - a calm, focused state that transforms the 42-boss gauntlet from chaos into choreography.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-hollowknight-teamcherry-activity-7384734827238809600-TdXn?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Hollow Knight',
        gameTitle: 'Hollow Knight',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post7-hollow-knight-pantheon_I8agrmcZdk.png',
        publishedDate: '2025-10-16',
        hashtags: [
          '#VideoGameWingman',
          '#HollowKnight',
          '#TeamCherry',
          '#GameDifficulty',
          '#AIInGaming',
          '#IndieGame',
        ],
        metadata: {
          seriesDay: 7,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '10 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~12%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~75%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 6 - Celeste
      {
        id: 6,
        title: 'Day 6 of the Toughest Game Series: Celeste: Chapter 9 - Farewell (Climbing Mountains, Inside and Out)',
        content: `Day 6 of the Toughest Game Series:

Celeste: Chapter 9 - Farewell (Climbing Mountains, Inside and Out):

There are some games that don't just test your reflexes - they test your heart.

For me, Celeste has always been one of those games. It's a story about climbing a mountain, but it's really about facing yourself - your doubts, your fears, your inner critic that whispers, "You can't."

And nowhere does that message hit harder than in Chapter 9: Farewell, a level that pushes players to their absolute limit.

It's brutally difficult. Every section demands perfection, yet every failure feels like progress.

As someone who's dealt with anxiety and depression, I connected deeply with what Celeste represents: the idea that perseverance isn't about being fearless - it's about moving forward even when you're scared.

🎯Difficulty Breakdown:

Difficulty Rating: 9 / 10

Average Completion Rate: ~30%

Completion Rate with Video Game Wingman: ~84%

Only about one in three players make it through this emotional and mechanical gauntlet.

But with Video Game Wingman's support, that number rises significantly - because success here isn't just about skill, it's about mindset.

🧠 How Video Game Wingman Helps Players Find Their Flow:

Celeste isn't a game you brute-force - it's a game you breathe through.

That's where Video Game Wingman steps in, combining gameplay analytics with mindfulness-inspired coaching:

✅ Dynamic Dash Path Visualization: Helps players "see" their next moves clearly, breaking down each screen into achievable motion paths.

✅ Rhythm-Based Focus Reminders: Uses subtle timing cues to help maintain calm and cadence during long dash sequences.

✅ Mental Stamina Coaching: Offers short reflection prompts between retries — small reminders to reset, breathe, and try again.

✅ Adaptive Encouragement System: Recognizes player frustration levels and adjusts feedback tone to reinforce patience and positivity.

Wingman doesn't just make you a better player - it helps you play with more self-compassion.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-celeste-indiegame-activity-7384354800521494528-AKZf?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Celeste',
        gameTitle: 'Celeste',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post6-celeste-farewell_T4jbhPoVB.png',
        publishedDate: '2025-10-15',
        hashtags: [
          '#VideoGameWingman',
          '#Celeste',
          '#IndieGame',
          '#MaddyMakesGames',
          '#GameDifficulty',
        ],
        metadata: {
          seriesDay: 6,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '9 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~30%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~84%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 5 - Super Mario Bros 2: The Lost Levels
      {
        id: 5,
        title: 'Day 5 of the Toughest Game Series: Super Mario Bros 2: The Lost Levels (World C-3) - When Precision Meets Chaos',
        content: `Day 5 of the Toughest Game Series:

Super Mario Bros 2: The Lost Levels (World C-3) - When Precision Meets Chaos:

Sometimes, the most innocent-looking games hide the most vicious challenges.

For players who thought they had mastered Super Mario Bros., The Lost Levels arrived as a rude awakening - and World C-3 stands as its most infamous test.

At first glance, it looks like another simple run through the Mushroom Kingdom. But then you realize… the wind pushes you off platforms, the Lakitus hurl Spiny shells from above, and your only lifeline is a series of perfectly timed spring jumps that demand absolute precision.

This isn't a level - it's a trial of wind and gravity.

🎯 Difficulty Breakdown

Difficulty Rating: 9.5 / 10

Average Completion Rate: ~20% (estimated)

Completion Rate with Video Game Wingman: ~78%

Only about one in five players make it through World C-3 on their own.

But with Video Game Wingman's guidance, nearly four out of five manage to reach that elusive goal flag.

🧠 How Video Game Wingman Guides Players Through the Storm

Video Game Wingman doesn't just say "jump better."

It transforms impossible platforming into a system of learnable patterns and visual rhythm.

✅ Wind-Adjusted Trajectory Training: Analyzes gust patterns and predicts how far players should aim before leaping, helping time jumps with precision.

✅ Momentum Visualization: Shows how spring tension and mid-air movement affect landing distance, building reliable muscle memory through repetition.

✅ Enemy Avoidance Coaching: Identifies Lakitu spawn timing and safe zones to minimize risk.

✅ Patience Calibration: Encourages players to slow their pace and commit only when timing feels right - turning frustration into flow.

With Wingman, panic becomes patience, and random failure becomes consistent success.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-nintendo-supermariobros2-activity-7383977742574186496-VMlB?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Super Mario Bros. 2: The Lost Levels',
        gameTitle: 'Super Mario Bros. 2: The Lost Levels',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post5-super-mario-bros2-worldC_D-CvKS-dW.png',
        publishedDate: '2025-10-14',
        hashtags: [
          '#VideoGameWingman',
          '#Nintendo',
          '#SuperMarioBros2',
          '#TheLostLevels',
          '#GameDifficulty',
          '#PrecisionMatters',
          '#AIInGaming',
        ],
        metadata: {
          seriesDay: 5,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '9.5 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~20%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~78%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 4 - Elden Ring: Malenia
      {
        id: 4,
        title: 'Day 4 of the Toughest Game Series: Elden Ring: Malenia, Blade of Miquella - The Goddess of Rot',
        content: `Day 4 of the Toughest Game Series:

Elden Ring: Malenia, Blade of Miquella - The Goddess of Rot:

Grace Through Adversity

Few names in gaming inspire both awe and fear quite like Malenia.

She's graceful, elegant - and utterly merciless.

Her blade dances faster than thought, her attacks heal her on every hit, and her infamous Waterfowl Dance has broken the will of even the most seasoned Tarnished.

It's not just a fight - it's a lesson in humility.

But it's also one of the most rewarding moments in Elden Ring when you finally triumph.

⚔️ Difficulty Breakdown:

Difficulty Rating: 10 / 10

Average Completion Rate: ~28%

Completion Rate with Video Game Wingman: ~81%

Only about one in four players manage to defeat Malenia unaided.

But with Video Game Wingman, over 80% conquer her - not because the fight is made easier, but because the player becomes smarter.

🧠 How Video Game Wingman Guides Tarnished to Victory:

Malenia punishes impatience. She rewards observation, adaptability, and composure - and that's exactly how Video Game Wingman teaches players to win.

✅ Spirit Ash Synergy Coaching: Recommends the best companions for your playstyle, analyzing Malenia's attack tempo to time summons effectively.

✅ Bleed Build Optimization: Calculates weapon and talisman loadouts that maximize DPS without compromising stamina efficiency.

✅ Waterfowl Dance Training: Uses visual telegraph slow-downs and timing simulation to help players master dodging her deadliest combo.

✅ Phase Transition Strategy: Provides real-time insight on when to disengage and reset posture before her Scarlet Rot transformation.

Wingman turns the impossible into a process - transforming confusion into confidence, and panic into precision.

💡 Question for you: What's the one boss that made you want to give up - but taught you something once you didn't?

Share your story below 👇`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-eldenring-fromsoftware-activity-7382516634801876992-TcXA?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Elden Ring',
        gameTitle: 'Elden Ring',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post4-elden-ring-malenia_jzwa2TJfx.png',
        publishedDate: '2025-10-10',
        hashtags: [
          '#VideoGameWingman',
          '#EldenRing',
          '#FromSoftware',
          '#AIInGaming',
          '#BossFights',
          '#GameDifficulty',
        ],
        metadata: {
          seriesDay: 4,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '10 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~28%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~81%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 3 - Sekiro
      {
        id: 3,
        title: 'Day 3 of the Toughest Game Series: ⚔️ Sekiro: Shadows Die Twice - Isshin the Sword Saint',
        content: `Day 3 of the Toughest Game Series:

⚔️ Sekiro: Shadows Die Twice - Isshin the Sword Saint

When Precision Becomes Perfection

If Dark Souls taught players patience, Sekiro taught them precision.

And no battle captures that spirit better than Isshin the Sword Saint - a duel that feels less like a fight and more like a conversation between blades.

Every parry, every deflect, every dodge matters. One slip, and the rhythm breaks.

This is where countless players hit their wall.

But for those who endure long enough to understand Isshin's dance - victory becomes one of the most satisfying achievements in modern gaming.

🩸 Difficulty Breakdown

Difficulty Rating: 10 / 10

Average Completion Rate: ~22%

Completion Rate with Video Game Wingman: ~79%

That's right - fewer than one in four players ever defeat Isshin unaided.

But with Video Game Wingman at their side, nearly four out of five emerge victorious.

Because in a battle of precision, knowledge truly is power.

🧠 How Video Game Wingman Turns Defeat into Discipline

Video Game Wingman doesn't just tell players to "deflect better."

It helps them see the fight differently - breaking down patterns and teaching mastery through feedback and rhythm:

✅ Deflect Pattern Recognition: Tracks timing windows for each of Isshin's attack strings, helping players internalize tempo.

✅ Posture Gauge Awareness: Trains players to manage both their posture and Isshin's, teaching when to strike, when to breathe, and when to hold.

✅ Phase Breakdown Tutorials: Visualizes each of Isshin's four brutal phases, highlighting safe counter points and danger cues.

✅ Reflex Practice Mode: Builds a custom simulation that hones micro-reaction time, so every parry feels instinctive.

Wingman transforms the chaos of Isshin's swordplay into a readable, learnable system - the same way a coach turns raw skill into mastery.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-sekiroshadowsdietwice-fromsoftware-activity-7382191859923656704-WqTM?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Sekiro: Shadows Die Twice',
        gameTitle: 'Sekiro: Shadows Die Twice',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post3-sekiro-isshin_6O9_OH5yv.png',
        publishedDate: '2025-10-09',
        hashtags: [
          '#VideoGameWingman',
          '#SekiroShadowsDieTwice',
          '#FromSoftware',
          '#GameDifficulty',
          '#AIInGaming',
          '#BossFights',
          '#GameCoaching',
        ],
        metadata: {
          seriesDay: 3,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '10 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~22%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~79%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 2 - Cuphead
      {
        id: 2,
        title: 'Day 2 of the Toughest Game Series: ☕🎶 Cuphead: The Devil\'s Final Phase – A Dance with Precision',
        content: `Day 2 of the Toughest Game Series:

☕🎶 Cuphead: The Devil's Final Phase – A Dance with Precision:

When Cuphead was released, it didn't just bring back 1930s cartoon art - it brought back old-school difficulty that made players shout, laugh, and sometimes question their life choices.

And no part of the game embodies that better than The Devil's Final Phase - a bullet-hell ballet that demands pixel-perfect timing, nerves of steel, and laser focus. One mistake, and it's all over.

🔥 Difficulty Breakdown:

Difficulty Rating: 9 / 10

Average Completion Rate: ~40%

Completion Rate with Video Game Wingman: ~85%

That means less than half of players make it through this final showdown - but with Video Game Wingman guiding them, most cross the finish line feeling unstoppable.

🧠 How Video Game Wingman Turns Chaos into Control:

Cuphead's challenge isn't random - it's rhythmic. The Devil's attacks follow subtle tempo shifts, projectile arcs, and rhythm-based cues that most players miss in the chaos.

Video Game Wingman steps in to decode that rhythm:

✅ Pattern Recognition Engine – Breaks boss attack sequences into visual segments for easier prediction.

✅ Timing Drills – Builds custom reflex exercises that teach when to jump, dash, or parry to the beat.

✅ Loadout Optimization – Suggests the best weapon pairings for your reflex speed and precision style.

✅ Stress Calibration Tips – Uses gameplay data to recommend short resets between phases for maximum consistency.

It's not about making the game easier - it's about making you more aware of what the game is really asking you to master.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-aiingaming-cuphead-activity-7381811048141529088-GTMm?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Cuphead',
        gameTitle: 'Cuphead',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post2-cuphead-devil_l3kysQr3Y.png',
        publishedDate: '2025-10-08',
        hashtags: [
          '#VideoGameWingman',
          '#AIInGaming',
          '#Cuphead',
          '#StudioMDHR',
          '#BossFights',
          '#GameDifficulty',
          '#GameCoaching',
        ],
        metadata: {
          seriesDay: 2,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '9 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~40%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~85%',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 1 - Dark Souls
      {
        id: 1,
        title: 'Day 1 of the Toughest Game Series: 🎮 Dark Souls: Ornstein & Smough – The Ultimate Test of Patience',
        content: `Day 1 of the Toughest Game Series:

🎮 Dark Souls: Ornstein & Smough – The Ultimate Test of Patience:

If you've ever faced the infamous duo Ornstein and Smough in Dark Souls, you know pain.

Not just ordinary "oops, I rolled too early" pain - I'm talking about controller-gripping, deep-sigh, soul-crushing pain.

This boss fight is legendary for a reason. Two elite knights - one lightning-fast and the other brutally heavy - tag-team you in a cathedral that offers no mercy.

It's a test of patience, precision, and mental stamina that has broken many would-be Chosen Undead.

⚔️ Difficulty Breakdown:

Difficulty Rating: 9.5 / 10

Average Completion Rate: ~35% (estimated)

Completion Rate with Video Game Wingman: ~82%

Only about one in three players conquer Ornstein & Smough on their own. But with Video Game Wingman, that number jumps dramatically - because this isn't just about getting "good." It's about understanding why you're losing and how to fix it.

🧠 How Video Game Wingman Helps:

When players struggle, Video Game Wingman doesn't just say, "Try dodging better."

It analyzes your gameplay patterns and provides actionable guidance:

✅ Stamina Management Coaching: Detects over-rolling and helps balance attack and recovery timing.

✅ Parry Timing Simulation: Offers rhythm-based training to sync your defensive reactions to enemy cues.

✅ Positioning Strategy: Highlights safe zones and recommends movement arcs to separate Ornstein from Smough.

✅ Dodge Rhythm Analysis: Uses visual feedback to perfect i-frame dodging consistency.

The result? A calmer, more methodical approach - the kind that transforms a chaotic fight into a measured dance.`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-gamedifficulty-darksouls-activity-7381393343513198592-yflc?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Dark Souls',
        gameTitle: 'Dark Souls',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series1-post1-dark-souls-ornstein-smough_L9HoiklIA.png',
        publishedDate: '2025-10-07',
        hashtags: [
          '#VideoGameWingman',
          '#GameDifficulty',
          '#DarkSouls',
          '#FromSoftware',
          '#AIinGaming',
          '#GamingCoaching',
        ],
        metadata: {
          seriesDay: 1,
          featuredStats: [
            {
              label: 'Difficulty Rating',
              value: '9.5 / 10',
              icon: 'chart',
            },
            {
              label: 'Average Completion Rate',
              value: '~35%',
              icon: 'chart',
            },
            {
              label: 'Completion Rate with Video Game Wingman',
              value: '~82%',
              icon: 'robot',
            },
          ],
        },
      },
    ],
  },
  completion: {
    seriesId: 'completion',
    seriesTitle: '100% Completion Chronicles',
    seriesDescription: 'The journey to achieving 100% completion in various games',
    introPost: {
      id: 0, // Intro posts use id: 0
      title: 'Introducing the "100% Completion Chronicles" Series',
      content: `🎮 Introducing the "100% Completion Chronicles" Series -

Mastery, Patience, and the Pursuit of Perfection:

For some gamers, finishing the story isn't enough.

It's about unlocking every secret, collecting every item, and earning that flawless 100%.

But true completion isn't just about skill — it's about discipline, organization, and determination.

It's when exploration turns into obsession, and that quiet inner voice says:

"I can't stop until I've done everything."

Over the next few weeks, I'll be sharing a 10-part series diving into the most iconic games famous for their 100% completion goals.

Each post will break down:

🎯 What "100% completion" really means for that game

⏱️ How long it typically takes — and how few players actually make it

📊 The Wingman-assisted completion rate and time reduction

💡 The Video Game Wingman strategies that turn a daunting grind into a guided path toward mastery

Video Game Wingman helps players do what many never thought possible - transforming the impossible checklist into a series of achievable milestones.

Through intelligent route planning, collectible tracking, and personalized strategy breakdowns, Wingman empowers players to finish everything without losing the joy of the journey.

Because sometimes, the ultimate victory isn't just beating the game —

It's beating every last part of it. 🏆`,
      linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-completionistchallenge-aiingaming-activity-7388715981080219648-NigI?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
      publishedDate: '2025-10-27',
      hashtags: [
        '#VideoGameWingman',
        '#CompletionistChallenge',
        '#AIInGaming',
        '#AchievementHunter',
        '#GameAnalytics',
      ],
    },
    posts: [
      // Post 10 - Super Mario Odyssey
      {
        id: 10,
        title: 'Final Day (10) of the 100% Completion Chronicles Series: Super Mario Odyssey - Moon Madness',
        content: `Final Day (10) of the 100% Completion Chronicles Series:

🌙 Super Mario Odyssey - Moon Madness

Powering Up to 100% Completion

If Dark Souls tests your patience and Resident Evil tests your precision, Super Mario Odyssey tests something else entirely - your sense of curiosity.

It's the ultimate "just one more thing" game.

You beat Bowser, save Peach, and think you're done - but then the hunt begins.

To reach 100% completion, players must collect:

🌕 999 Power Moons

👕 Every Costume and Outfit

🏰 All Kingdom Challenges and Secrets

It's cheerful, creative, and deceptively huge - a masterclass in playful design that turns exploration into obsession.

⏱️ Average Completion Time: ~60 hours

📉 Average 100% Completion Rate: ~14%

🤖 Wingman-Assisted Completion: ~40 hours | ~30% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman doesn't point out where every Moon is hiding - but it helps you plan your journey to find them all.

✅ Route-Based Planning: Organizes progress kingdom-by-kingdom, helping players focus on smaller exploration goals instead of the overwhelming total.

✅ Progress Tracking: Lets users note what they've already completed - perfect for keeping track of Moon counts, costumes, and challenges.

✅ Motivational Milestones: Celebrates progress with achievement unlocks and small wins, making long completion runs feel fun and rewarding.

By helping players stay focused and organized, Wingman transforms 100% completion from an endless scavenger hunt into a guided adventure full of progress and celebration.

Because in Super Mario Odyssey, the real joy isn't just reaching the last Moon -

It's enjoying the journey to get there. 🌍✨`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-supermarioodyssey-nintendo-activity-7398836469504839681-XwP4?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Super Mario Odyssey',
        gameTitle: 'Super Mario Odyssey',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post10-super-mario-odyssey_Rsaj8JtDe.png',
        publishedDate: '2025-11-24',
        hashtags: [
          '#VideoGameWingman',
          '#SuperMarioOdyssey',
          '#Nintendo',
          '#3DPlatformer',
          '#100PercentCompletion',
          '#AchievementHunter',
          '#AIAssistant',
          '#NintendoSwitch',
        ],
        metadata: {
          seriesDay: 10,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~60 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~14%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~40 hours | ~30% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 9 - Resident Evil 4 Remake
      {
        id: 9,
        title: 'Day 9 of my 100% Completion Chronicles Series: Resident Evil 4 Remake - Merchant of Completion',
        content: `Day 9 of my 100% Completion Chronicles Series:

Resident Evil 4 Remake - Merchant of Completion

100% Mastery in the Village of Survival:

"Not enough cash, stranger."

Every player remembers that line - the iconic voice of the Merchant reminding us that Resident Evil 4 Remake is as much about resource management as it is about survival.

For completionists, this isn't just about escaping the nightmare - it's about mastering it.

Achieving 100% completion means collecting every treasure, fully upgrading every weapon, earning S+ ranks, and clearing every challenge the game throws at you.

It's a run that tests more than aim or reflexes - it tests discipline under pressure.

⏱️ Average Completion Time: ~45 hours

📉 Average 100% Completion Rate: ~9%

🤖 Wingman-Assisted Completion: ~30 hours | ~20% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman doesn't count bullets or aim for you - but it does help you approach survival with strategy and structure.

✅ Run Planning & Progress Checklists: Outlines the full set of collectibles, challenges, and S-rank criteria so players can stay organized across multiple playthroughs.

✅ Efficiency Tips & Upgrade Guidance: Provides general advice on prioritizing weapons, managing inventory space, and planning repeat runs for minimal backtracking.

✅ Achievement Tracking & Motivation: Celebrates progress through milestone achievements, turning each cleared chapter or completed upgrade into visible progress toward 100%.

With Wingman, the pursuit of perfection feels less like stress management - and more like mission management.

Because in Resident Evil 4 Remake, true survival isn't just making it out alive - it's walking away knowing you conquered every last challenge the Merchant had to offer. 💼🔫`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-residentevil4remake-capcom-activity-7397700949038866432-aaMa?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Resident Evil 4 Remake',
        gameTitle: 'Resident Evil 4 Remake',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post9-resident-evil4-remake_XWtaEHGu0.png',
        publishedDate: '2025-11-21',
        hashtags: [
          '#VideoGameWingman',
          '#ResidentEvil4Remake',
          '#Capcom',
          '#SurvivalHorror',
          '#100PercentCompletion',
          '#AchievementHunter',
          '#AIAssistant',
        ],
        metadata: {
          seriesDay: 9,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~45 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~9%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~30 hours | ~20% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 8 - Tetris Effect
      {
        id: 8,
        title: 'Day 8 of my 100% Completion Chronicles Series: Tetris Effect: Connected - Perfect Stacks and Sync',
        content: `Day 8 of my 100% Completion Chronicles Series:

🧩 Tetris Effect: Connected - Perfect Stacks and Sync

Achieving 100% in a Game About Flow, Focus, and Harmony:

Not every challenge needs a sword, a story, or a sprawling world.

Some of gaming's purest tests come from a simple idea: how long can you keep your rhythm before everything falls apart?

Tetris Effect: Connected is exactly that — a game of clarity and composure.

For completionists, the goal is deceptively simple yet incredibly demanding:

🎵 Clear all modes with S-ranks

🏆 Unlock every achievement

💡 Maintain perfect rhythm under constant pressure

Each piece, each beat, each blink of the screen becomes a moment of decision - a test of flow, not force.

⏱️ Average Completion Time: ~55 hours

📉 Average 100% Completion Rate: ~18%

🤖 Wingman-Assisted Completion: ~35 hours | ~35% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman can't control your reflexes - but it can help you control your mindset.

✅ Structured Practice Planning: Encourages players to break their completion goals into manageable sessions, focusing on one mode or rank at a time.

✅ Pattern Awareness Exercises: Helps players identify their most common failure points - like misdrops or overstacking - through reflection and milestone notes.

✅ Focus & Flow Reminders: Promotes pacing, rest intervals, and steady improvement rather than burnout, keeping players in the zone longer.

By helping players organize their efforts and track meaningful progress, Wingman turns the pursuit of S-rank perfection into a mindful routine - one built on rhythm, repetition, and resilience.

Because sometimes, mastery isn't about reaction time -

It's about staying in sync with the moment. 🎶🧠`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-tetriseffect-100percentcompletion-activity-7397051512998293504-oBn6?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Tetris Effect',
        gameTitle: 'Tetris Effect',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post8-tetris-effect-connected_QMd5UvLhI.png',
        publishedDate: '2025-11-19',
        hashtags: [
          '#VideoGameWingman',
          '#TetrisEffect',
          '#100PercentCompletion',
          '#PuzzleGame',
          '#RhythmGame',
          '#FocusAndFlow',
          '#AchievementHunter',
          '#AIAssistant',
        ],
        metadata: {
          seriesDay: 8,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~55 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~18%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~35 hours | ~35% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 7 - Dark Souls III
      {
        id: 7,
        title: 'Day 7 of my 100% Completion Chronicles Series: 🔥 Dark Souls III - No Bonfire Left Behind',
        content: `Day 7 of my 100% Completion Chronicles Series: 🔥 Dark Souls III - No Bonfire Left Behind

The Pursuit of 100% in the Kingdom of Ash:

"You Died." Two words every Dark Souls player knows well.

But for completionists, those words aren't a setback - they're a call to mastery.

Dark Souls III isn't just about surviving; it's about understanding - the world, the bosses, and your own persistence.

And for the few who chase 100% completion, the journey means conquering:

⚔️ All bosses
🛡️ Every covenant
💍 All rings and miracles
🏆 Every achievement

It's a pilgrimage through fire, repetition, and resilience - an experience that forges not just skill, but patience.

⏱️ Average Completion Time: ~100 hours
📉 Average 100% Completion Rate: ~5%
🤖 Wingman-Assisted Completion: ~75 hours | ~15% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman isn't here to roll through boss attacks or manage your stamina bar - it's here to help bring order to the chaos.

✅ Multi-Run Planner (NG+ Guidance): Helps players structure multiple playthroughs to collect missable endings, rings, and items without losing track.

✅ Progress Journaling: Encourages players to log milestones, bosses defeated, and covenants joined — making each victory tangible and trackable.

✅ Achievement Tracking: Keeps players motivated with incremental rewards for major completions, reinforcing that every run has purpose.

Through organization and reflection, Wingman helps Soulsborne fans turn frustration into forward progress - every defeat, a lesson; every run, a step closer to mastery.

Because in Dark Souls III, completion isn't just about lighting every bonfire.

It's about the flame you carry within. 🔥⚔️`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-darksoulsiii-fromsoftware-activity-7395195559554334720-4Y-F?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Dark Souls III',
        gameTitle: 'Dark Souls III',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post7-dark-souls-III_mvSpUowSR.png',
        publishedDate: '2025-11-14',
        hashtags: [
          '#VideoGameWingman',
          '#DarkSoulsIII',
          '#FromSoftware',
          '#ActionRPG',
          '#100PercentCompletion',
          '#AchievementHunter',
          '#AIAssistant',
        ],
        metadata: {
          seriesDay: 7,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~100 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~5%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~75 hours | ~15% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 6 - Stardew Valley
      {
        id: 6,
        title: 'Day 6 of my 100% Completion Chronicles Series: 🌾 Stardew Valley - The Perfect Farm',
        content: `Day 6 of my 100% Completion Chronicles Series: 🌾 Stardew Valley - The Perfect Farm

Reaching Perfection, One Season at a Time:

Few games capture the quiet joy of progress like Stardew Valley.

What starts as a small patch of land and a handful of seeds slowly becomes something greater - a reflection of patience, planning, and heart.

But for completionists, the real challenge lies in the Perfection Tracker - an all-encompassing goal that asks players to master friendships, skills, collections, cooking, secrets, and Qi Challenges.

⏱️ Average Completion Time: ~150 hours
📉 Average 100% Completion Rate: ~10%
🤖 Wingman-Assisted Completion: ~90 hours | ~28% of players finish

It's not just about farming.

💡 How Video Game Wingman Helps:

Video Game Wingman isn't just an assistant for gamers chasing trophies - it's a companion for players chasing perfection.

✅ Season Planner: Helps organize goals for each in-game season — from crop choices to community center bundles.

✅ Relationship & Festival Calendar: Keeps track of important events, birthdays, and gift preferences so every friendship can thrive.

✅ Progress Milestones: Encourages consistent growth by celebrating incremental progress, not just the end result.

Instead of trying to juggle everything at once, Wingman helps players turn Stardew Valley's endless checklist into a meaningful, manageable journey — one that feels just as rewarding as the first time you harvest a gold-quality pumpkin. 🎃

It's about finding balance - between efficiency and enjoyment, planning and spontaneity.

Because in Pelican Town, perfection isn't rushed -

It's cultivated. 🌻`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-stardewvalley-concernedape-activity-7394867750399258625-6JaQ?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Stardew Valley',
        gameTitle: 'Stardew Valley',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post6-stardew-valley_m9WEw5dbp.png',
        publishedDate: '2025-11-13',
        hashtags: [
          '#VideoGameWingman',
          '#StardewValley',
          '#ConcernedApe',
          '#FarmLifeSim',
          '#100PercentCompletion',
          '#AIAssistant',
          '#AchievementHunter',
        ],
        metadata: {
          seriesDay: 6,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~150 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~10%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~90 hours | ~28% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 5 - Gran Turismo 7
      {
        id: 5,
        title: 'Day 5 of my 100% Completion Chronicles Series: 🏁 Gran Turismo 7 - Full Throttle Completion',
        content: `Day 5 of my 100% Completion Chronicles Series: 🏁 Gran Turismo 7 - Full Throttle Completion

Gold Across the Grid:

Racing games make you feel fast. But Gran Turismo 7 makes you earn that feeling.

Every corner, every braking point, every perfect line through a chicane - it's a test of precision and patience.

And for completionists, it's not enough to just finish the race. True mastery means gold medals on every license, mission, and event, plus a garage filled with fully tuned cars - a celebration of both skill and endurance.

⏱️ Average Completion Time: ~150 hours
📉 Average 100% Completion Rate: ~6%
🤖 Wingman-Assisted Completion: ~90 hours | ~18% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman can't drive the laps for you - but it can help you drive your improvement.

✅ Structured Goal Planning: Breaks the path to gold medals into smaller, track-based goals - keeping progress organized and motivating.

✅ Performance Journaling: Encourages players to record best times, corner trouble spots, and tuning notes to visualize growth over time.

✅ Achievement Tracking: Rewards persistence with milestone recognition - each gold, each license, each breakthrough logged and celebrated.

Where most racers hit the wall of repetition, Wingman helps players see progress in every attempt, turning frustration into focused improvement.

Because in Gran Turismo 7, completion isn't just about speed.

It's about the journey to perfection. 🏁`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-granturismo7-polyphonydigital-activity-7394124940402327554-lPCH?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Gran Turismo 7',
        gameTitle: 'Gran Turismo 7',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post5-gran-turismo7_iWjybYG78.png',
        publishedDate: '2025-11-11',
        hashtags: [
          '#VideoGameWingman',
          '#GranTurismo7',
          '#PolyphonyDigital',
          '#Racing',
          '#AchievementHunter',
          '#100PercentCompletion',
          '#AIInGaming',
        ],
        metadata: {
          seriesDay: 5,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~150 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~6%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~90 hours | ~18% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 4 - Persona 5 Royal
      {
        id: 4,
        title: 'Day 4 of the 100% Completion Chronicles Series: Persona 5 Royal - Every Confidant, Every Treasure',
        content: `Day 4 of the 100% Completion Chronicles Series:

Persona 5 Royal - Every Confidant, Every Treasure

The Art of 100% Completion in the Metaverse:

Every day in Persona 5 Royal matters.

One morning you're bonding with a teammate over coffee - the next, you're deep in a palace stealing the heart of a corrupted CEO.

And for completionists, it's not just about saving Tokyo - it's about mastering the calendar itself.

To achieve 100% completion, players must:

📚 Max every Confidant relationship

🃏 Fuse every Persona

📘 Complete the Compendium

🏆 Earn every Trophy

It's a delicate balance of time management, social choices, dungeon dives, and study sessions.

Miss one deadline, and that perfect run slips away:

⏱️ Average Completion Time: 120 - 160 hours

📉 Average 100% Completion Rate: ~6%

🤖 Wingman-Assisted Completion: 80 - 100 hours | ~20% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman doesn't hack your save file or automate your choices - it helps you plan your path to perfection.

✅ Calendar-Based Efficiency Planning: Breaks long-term goals into daily objectives - when to study, hang out, or infiltrate.

✅ Social-Stat Growth Guidance: Helps prioritize which stats (Charm, Guts, Proficiency, etc.) to raise first based on your current progress.

✅ Missable Event Alerts: Highlights limited-day opportunities (like seasonal Confidant scenes or Palace deadlines) so nothing important slips through.

By transforming the complex structure of Persona 5 Royal into a clear, achievable roadmap, Wingman turns an overwhelming to-do list into a confident schedule for success.

Because in the Metaverse - just like in real life - timing is everything. ⏳💫`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-persona5royal-atlus-activity-7393723682566721536-MENA?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Persona 5 Royal',
        gameTitle: 'Persona 5 Royal',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post4-persona5-royal_vbKzo9qr2.png',
        publishedDate: '2025-11-10',
        hashtags: [
          '#VideoGameWingman',
          '#Persona5Royal',
          '#Atlus',
          '#JRPG',
          '#AchievementHunter',
          '#100PercentCompletion',
          '#AIInGaming',
        ],
        metadata: {
          seriesDay: 4,
        },
      },
      // Post 3 - Donkey Kong 64
      {
        id: 3,
        title: 'Day 3 of the 100% Completion Chronicles Series: 🍌 Donkey Kong 64 - Banana Madness: Chasing 101%',
        content: `Day 3 of the 100% Completion Chronicles Series:

🍌 Donkey Kong 64 - Banana Madness: Chasing 101%

The Collect-a-thon That Broke (and Defined) a Genre:

Before open-world checklists or achievement pop-ups, there was Donkey Kong 64 - a game so stuffed with collectibles that players joked you needed a spreadsheet just to remember where you'd been.

To reach 101% completion, you had to gather:

🍌 Every golden banana

💰 Every banana coin

🧩 Every blueprint

🥇 Every banana medal

🧚‍♀️ Every banana fairy

It wasn't just platforming - it was project management.

And while it's a beloved part of Nintendo 64 history, Donkey Kong 64 also became infamous for over-collecting fatigue - a design so ambitious that it helped mark the decline of the "collect-a-thon" era.

⏱️ Average Completion Time: 30 - 40 hours

📉 Average 101% Completion Rate: ~10%

🤖 Wingman-Assisted Completion: 15 - 25 hours | ~28% of players finish

💡 How Video Game Wingman Helps:

For games like Donkey Kong 64, Video Game Wingman acts less like a tracker - and more like a completion coach.

It doesn't integrate into the game or count your bananas automatically — instead, it gives players the structure and clarity that the original game never did.

✅ Level-by-Level Planning: Breaks down objectives by area (Jungle Japes, Frantic Factory, Crystal Caves, etc.) so you always know what's next.

✅ Collectible Checklists: Offers clear item categories you can log manually or reference while playing, reducing confusion between the five Kong's separate abilities.

✅ Progress Reminders: Encourages steady progress through small milestones - celebrating achievements instead of turning completion into a grind.

By helping players organize their journey instead of overwhelming them with it, Wingman brings a sense of calm to the chaos.

So whether you're a nostalgic collector or a first-timer aiming for that coveted 101%, Video Game Wingman turns "Where did I miss that last banana?" into "One more level to go." 🍌✨`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-donkeykong64-nintendo-activity-7389744523477688322-ZxU7?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Donkey Kong 64',
        gameTitle: 'Donkey Kong 64',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post3-donkey-kong-64_60I2y4CQy.png',
        publishedDate: '2025-10-30',
        hashtags: [
          '#VideoGameWingman',
          '#DonkeyKong64',
          '#Nintendo',
          '#100PercentCompletion',
          '#AIInGaming',
          '#AIAssistant',
          '#Platformer',
        ],
        metadata: {
          seriesDay: 3,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '30 - 40 hours',
              icon: 'clock',
            },
            {
              label: 'Average 101% Completion Rate',
              value: '~10%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '15 - 25 hours | ~28% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 2 - The Legend of Zelda: Breath of the Wild
      {
        id: 2,
        title: 'Day 2 of the 100% Completion Chronicles Series: The Legend of Zelda: Breath of the Wild - Every Shrine, Every Seed',
        content: `Day 2 of the 100% Completion Chronicles Series: The Legend of Zelda: Breath of the Wild - Every Shrine, Every Seed

The True Path to 100% in Hyrule:

Few games capture the feeling of pure exploration quite like The Legend of Zelda: Breath of the Wild. Every mountaintop invites discovery. Every valley hides a secret. And for completionists, every corner of Hyrule is another step toward perfection.

But chasing 100% completion here isn't just a quest - it's a commitment. There are 120 Shrines, 900 Korok Seeds, and a full map and compendium waiting for the most dedicated adventurers.

It's a journey that blends patience with precision. And for many players, it can stretch far beyond the horizon.

⏱️ Average Completion Time: ~150 hours
📉 Average 100% Completion Rate: ~5%
🤖 Wingman-Assisted Completion: ~90 hours | ~18% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman doesn't fast-travel your way to victory — it helps you plan your adventure intelligently.

✅ Route Optimization: Suggests efficient paths through Korok seed clusters and shrines to minimize aimless wandering.

✅ Priority Shrine Mapping: Helps players decide which shrines to tackle first for better stamina and mobility early on.

✅ Pacing Reminders: Encourages balanced sessions — because completing Hyrule shouldn't feel like climbing Mount Lanayru in one go.

By transforming overwhelming checklists into focused exploration plans, Wingman helps players stay motivated, organized, and in control of their 100% journey.

In a world as vast as Hyrule, sometimes the real magic isn't just finding everything -

It's finding your own rhythm along the way. 🌿`,

        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-thelegendofzelda-breathofthewild-activity-7389442240529502208-BnzD?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'The Legend of Zelda: Breath of the Wild',
        gameTitle: 'The Legend of Zelda: Breath of the Wild',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post2-zelda-breath-of-the-wild_ulX49-XKm.png',
        publishedDate: '2025-10-29',
        hashtags: [
          '#VideoGameWingman',
          '#TheLegendOfZelda',
          '#BreathOfTheWild',
          '#Nintendo',
          '#100PercentCompletion',
          '#AIInGaming',
          '#OpenWorldGaming',
        ],
        metadata: {
          seriesDay: 2,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '~150 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~5%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '~90 hours | ~18% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
      // Post 1 - Red Dead Redemption 2
      {
        id: 1,
        title: 'Day 1 of the 100% Completion Chronicles Series: Red Dead Redemption 2 - The Completionist\'s Frontier',
        content: `Day 1 of the 100% Completion Chronicles Series:

Red Dead Redemption 2 - The Completionist's Frontier

Taming Every Challenge in the Wild West:

Some games don't just ask for your time - they ask for your commitment.

Red Dead Redemption 2 is one of those rare experiences.

It's not just a story - it's a living world full of details that completionists can spend hundreds of hours exploring.

To hit 100% completion, players must conquer story missions, side quests, challenges, collectibles, and compendium entries scattered across one of the most ambitious open worlds ever built.

And while it's a masterpiece, it's also a marathon:

⏱️ Average Completion Time: 180 - 250 hours

📉 Average 100% Completion Rate: ~7%

🤖 Wingman-Assisted Completion: 110 - 140 hours | ~25% of players finish

💡 How Video Game Wingman Helps:

Video Game Wingman doesn't play for you - it plans with you.

Rather than real-time tracking, it offers knowledge-driven structure and guidance to help completionists stay focused and motivated through long journeys like Red Dead Redemption 2.

✅ Region-by-Region Planning: Helps players organize goals by area to avoid feeling overwhelmed.

✅ Challenge & Collectible Checklists: Guides users through what's needed for 100% without requiring manual cross-referencing across multiple sites.

✅ Progress Tracking: Achievement-style progress markers reward consistency and provide small wins along the way.

The result? A smarter, calmer path toward full completion - one that celebrates patience, planning, and persistence over pure grind.

Because out on the frontier, perfection isn't about rushing.

It's about finishing everything - one steady ride at a time. 🤠`,
        linkedInUrl: 'https://www.linkedin.com/posts/michael-gambardella-9a1536131_videogamewingman-reddeadredemption2-rockstargames-activity-7389082413823320064-qy4k?utm_source=share&utm_medium=member_desktop&rcm=ACoAACBK7QkBJFJTpOL8YqtEzGboq00kk_1COng',
        game: 'Red Dead Redemption 2',
        gameTitle: 'Red Dead Redemption 2',
        imageUrl: 'https://ik.imagekit.io/q37npn1m5/linkedin-posts/series2-post1-red-dead-redemption2_nEyKx6Crc.png',
        publishedDate: '2025-10-28',
        hashtags: [
          '#VideoGameWingman',
          '#RedDeadRedemption2',
          '#RockstarGames',
          '#AIInGaming',
          '#CompletionistChallenge',
          '#AchievementHunter',
        ],
        metadata: {
          seriesDay: 1,
          featuredStats: [
            {
              label: 'Average Completion Time',
              value: '180 - 250 hours',
              icon: 'clock',
            },
            {
              label: 'Average 100% Completion Rate',
              value: '~7%',
              icon: 'chart',
            },
            {
              label: 'Wingman-Assisted Completion',
              value: '110 - 140 hours | ~25% of players finish',
              icon: 'robot',
            },
          ],
        },
      },
    ],
  },
};

/**
 * GET /api/public/linkedin-posts/series
 * Returns list of available series for the splash page
 */
router.get('/public/linkedin-posts/series', async (req: Request, res: Response) => {
  try {
    const series = Object.values(LINKEDIN_POSTS).map(series => ({
      seriesId: series.seriesId,
      seriesTitle: series.seriesTitle,
      seriesDescription: series.seriesDescription,
      hasIntroPost: !!series.introPost,
      postCount: series.posts.length,
    }));

    return res.status(200).json({
      success: true,
      series: series,
    });
  } catch (error) {
    console.error('Error fetching LinkedIn post series:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch LinkedIn post series',
    });
  }
});

/**
 * GET /api/public/linkedin-posts
 * Returns posts from a specific series
 * Query params:
 *   - seriesId: (optional) series ID to view (defaults to first available series)
 *   - limit: number of posts to return (default: 1, max: 10 - loads one at a time)
 *   - offset: number of posts to skip (default: 0) - for pagination
 * 
 * Usage:
 *   - Initial load: GET /api/public/linkedin-posts?seriesId=challenging&limit=1&offset=0
 *   - Load more: GET /api/public/linkedin-posts?seriesId=challenging&limit=1&offset=1
 *   - Get all: GET /api/public/linkedin-posts?seriesId=challenging&limit=10&offset=0
 */
router.get('/public/linkedin-posts', async (req: Request, res: Response) => {
  try {
    // Get series ID from query params
    const seriesIdFromQuery = String(req.query.seriesId || '').trim();
    
    // Determine which series to use
    let selectedSeries: LinkedInSeries | null = null;
    
    if (seriesIdFromQuery && LINKEDIN_POSTS[seriesIdFromQuery]) {
      selectedSeries = LINKEDIN_POSTS[seriesIdFromQuery];
    } else {
      // Default to first available series
      const firstSeriesKey = Object.keys(LINKEDIN_POSTS)[0];
      selectedSeries = firstSeriesKey ? LINKEDIN_POSTS[firstSeriesKey] : null;
    }

    if (!selectedSeries) {
      return res.status(404).json({
        success: false,
        message: 'No LinkedIn post series found',
      });
    }

    // Parse and validate limit parameter
    const limitParam = req.query.limit;
    let limit = 1; // default: show first post initially
    if (limitParam) {
      const parsedLimit = parseInt(String(limitParam), 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 10); // cap at 10 posts max
      }
    }

    // Parse and validate offset parameter
    const offsetParam = req.query.offset;
    let offset = 0; // default: start from beginning
    if (offsetParam) {
      const parsedOffset = parseInt(String(offsetParam), 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }

    // Get all posts from the series, sorted by id (post number)
    const allPosts = [...selectedSeries.posts].sort((a, b) => a.id - b.id);

    // Apply pagination
    const paginatedPosts = allPosts.slice(offset, offset + limit);

    // Return series metadata along with posts
    return res.status(200).json({
      success: true,
      series: {
        seriesId: selectedSeries.seriesId,
        seriesTitle: selectedSeries.seriesTitle,
        seriesDescription: selectedSeries.seriesDescription,
        totalPosts: allPosts.length,
      },
      posts: paginatedPosts,
      count: paginatedPosts.length,
      hasMore: offset + limit < allPosts.length, // Indicates if more posts are available
    });
  } catch (error) {
    console.error('Error fetching LinkedIn posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch LinkedIn posts',
      ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' })
    });
  }
});

/**
 * GET /api/public/linkedin-posts/intro
 * Returns the introductory post for a specific series
 * Query params:
 *   - seriesId: (optional) series ID (defaults to first available series)
 * 
 * Usage:
 *   - GET /api/public/linkedin-posts/intro?seriesId=challenging
 */
router.get('/public/linkedin-posts/intro', async (req: Request, res: Response) => {
  try {
    // Get series ID from query params
    const seriesIdFromQuery = String(req.query.seriesId || '').trim();
    
    // Determine which series to use
    let selectedSeries: LinkedInSeries | null = null;
    
    if (seriesIdFromQuery && LINKEDIN_POSTS[seriesIdFromQuery]) {
      selectedSeries = LINKEDIN_POSTS[seriesIdFromQuery];
    } else {
      // Default to first available series
      const firstSeriesKey = Object.keys(LINKEDIN_POSTS)[0];
      selectedSeries = firstSeriesKey ? LINKEDIN_POSTS[firstSeriesKey] : null;
    }

    if (!selectedSeries) {
      return res.status(404).json({
        success: false,
        message: 'No LinkedIn post series found',
      });
    }

    if (!selectedSeries.introPost) {
      return res.status(404).json({
        success: false,
        message: `No introductory post found for series "${selectedSeries.seriesTitle}"`,
      });
    }

    return res.status(200).json({
      success: true,
      series: {
        seriesId: selectedSeries.seriesId,
        seriesTitle: selectedSeries.seriesTitle,
      },
      post: selectedSeries.introPost,
    });
  } catch (error) {
    console.error('Error fetching LinkedIn intro post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch LinkedIn intro post',
      ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' })
    });
  }
});

/**
 * GET /api/public/linkedin-posts/:postId
 * Returns a specific post by ID within a series
 * Query params:
 *   - seriesId: (optional) series ID (defaults to first available series)
 * 
 * Usage:
 *   - GET /api/public/linkedin-posts/1?seriesId=challenging
 */
router.get('/public/linkedin-posts/:postId', async (req: Request, res: Response) => {
  try {
    const postIdParam = req.params.postId;
    const postId = parseInt(postIdParam, 10);

    if (isNaN(postId) || postId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID. Post ID must be a positive number.',
      });
    }

    // Get series ID from query params
    const seriesIdFromQuery = String(req.query.seriesId || '').trim();
    
    // Determine which series to use
    let selectedSeries: LinkedInSeries | null = null;
    
    if (seriesIdFromQuery && LINKEDIN_POSTS[seriesIdFromQuery]) {
      selectedSeries = LINKEDIN_POSTS[seriesIdFromQuery];
    } else {
      // Default to first available series
      const firstSeriesKey = Object.keys(LINKEDIN_POSTS)[0];
      selectedSeries = firstSeriesKey ? LINKEDIN_POSTS[firstSeriesKey] : null;
    }

    if (!selectedSeries) {
      return res.status(404).json({
        success: false,
        message: 'No LinkedIn post series found',
      });
    }

    // Find the post by ID
    const post = selectedSeries.posts.find(p => p.id === postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post ${postId} not found in series "${selectedSeries.seriesTitle}"`,
      });
    }

    return res.status(200).json({
      success: true,
      series: {
        seriesId: selectedSeries.seriesId,
        seriesTitle: selectedSeries.seriesTitle,
      },
      post: post,
    });
  } catch (error) {
    console.error('Error fetching LinkedIn post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch LinkedIn post',
      ...(process.env.NODE_ENV === 'development' && { error: error instanceof Error ? error.message : 'Unknown error' })
    });
  }
});

export default router;

