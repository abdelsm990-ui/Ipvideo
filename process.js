const fs = require('fs');

const files = [
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\index.html',
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\login.html',
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\register.html',
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\dashboard.html',
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\generate.html',
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\pricing.html',
  'C:\\\\Users\\\\Hp\\\\Desktop\\\\Ipvideo\\\\client\\\\how-it-works.html',
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  console.log(f.split('\\\\').pop() + ' length: ' + content.length);
});
