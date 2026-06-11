const apiUrl = 'http://172.16.1.233:3002/';
const imgPath = `/assets/img/`;

export const environment = {
  production: true,
  api: `${apiUrl}`,
  api_security: `${apiUrl}auth/`,
  imgPath: imgPath,
};
