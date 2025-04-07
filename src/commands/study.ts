import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';  // Assuming 'name' is already imported from package.json

const debug = createDebug('bot:study_command');

const study = () => async (ctx: Context) => {
  const message = `*${name} Study Resources*:
  \n\n
  1. Akash Test Series 2024
  [Link](https://1024terabox.com/s/1p2-kKH5huVDr54pZbnK9TQ)

  2. Allen Modules
  [Link](https://1024terabox.com/s/10fXMK_5BU6zs9UHRtZ-aSg)

  3. Allen Test 2024
  [Link](https://1024terabox.com/s/1U9dQIxWSHIpc2dVdsQVIDg)

  4. Biohack 4th Edition by Parth Goyal
  [Link](https://1024terabox.com/s/1vUMRiXXaV_sHbfUbYTf_pA)

  5. Botany - Know Your NCERT
  [Link](https://1024terabox.com/s/1EJRNpPf3gXyosbuCjrimjg)

  6. Botany Med Easy
  [Link](https://1024terabox.com/s/1_PX621zvPR48crHuauf3YQ)

  7. Chemistry - Know Your NCERT
  [Link](https://1024terabox.com/s/1MLVkRyZuiuJiIxp8dYaoOA)

  8. JEE Advanced PYQ
  [Link](https://1024terabox.com/s/1Wu6TEAiimGiurjhi4Um55g)

  9. NCERT Diagrams All-in-One
  [Link](https://1024terabox.com/s/1AzrlX4CgNN47SFkHmXw6zA)

  10. NEET 11 Years Chapterwise PYQ
  [Link](https://1024terabox.com/s/18gI4b16ItXo7D9ZkwQ2MaA)

  11. NTA NEET Speed Test
  [Link](https://1024terabox.com/s/1JIw7MuQDC-3UtVg_Wt91KQ)

  12. Physics - Know Your NCERT
  [Link](https://1024terabox.com/s/1VTkburtz8JN9In7Jn8gf-w)

  13. PYQ JEE with Solutions
  [Link](https://1024terabox.com/s/1UXzgF2-0420a7WDFDkj-pg)

  14. Zoology - Know Your NCERT
  [Link](https://1024terabox.com/s/1Xzgvz5oMFVxlLM6MWe2j1g)

  15. Med Easy Physics Original
  [Link](https://1024terabox.com/s/1Aenhi_ofQSZ5Nk0Np_f7YA)

  16. Akash Modules 
  [Link](https://1024terabox.com/s/1nATVmTd1fcXoTTlwfu-0CA)

  17. Biology Punch 
  [Link](https://1024terabox.com/s/1P1kqX3-FUHH6-NVxewzUGQ)

  18. Chemistry punch
  [Link](https://1024terabox.com/s/15bfJcON-qFZsaW8CAOv1Lg)

  19. Physics punch 
  [Link](https://1024terabox.com/s/1Bi0ZitCvfIxGeojb5K1KwQ)

  20. Biology Punch
  [Link](https://1024terabox.com/s/1P1kqX3-FUHH6-NVxewzUGQ)

  21. Chemistry Punch
  [Link](https://1024terabox.com/s/15bfJcON-qFZsaW8CAOv1Lg)

  22. Physics Punch 
  [Link](https://1024terabox.com/s/1Bi0ZitCvfIxGeojb5K1KwQ)

  23. 101 Tests full syllabus 
  [Link](https://1024terabox.com/s/1JIw7MuQDC-3UtVg_Wt91KQ)

  24. Akash Test 2024(FT,FTS,AIATS,NBTS,CT,Intensive)
  Akash Modules 2024
  Akash polls 2024-25
  Akash NEET PREP TEST SERIES 
  ALLL IN ONE 🦚
  [Link](https://1024terabox.com/s/14Imzih0HP4ibjcNxnb6x4w)`;

  debug(`Triggered "study" command with message \n${message}`);
  
  await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
};

export { study };
