const favicons = require('favicons');
const fs = require('fs');

const srcAppIcon = 'tools/resources/app-icon.svg';
const confAppIcon = {
  path: 'assets/icons/',
  background: 'ffffff',
  logging: false,
  icons: {
    android: { offset: 5, background: 'ffffff' },
    appleIcon: { offset: 5, background: 'ffffff' },
    appleStartup: false,
    coast: false,
    favicons: { offset: 5, background: 'ffffff' },
    firefox: false,
    windows: false,
    yandex: false
  }
};

favicons(srcAppIcon, confAppIcon, function(error, response) {
  if (error) {
    console.log(error.message);
    return;
  }

  // Array of { name: string, contents: <buffer> }
  response.images.forEach(image => {
    fs.writeFileSync('src/assets/icons/' + image.name, image.contents);
  });

  // Array of strings (html elements)
  response.html.forEach(element => {
    console.log(element);
  });
});
