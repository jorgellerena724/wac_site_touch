const apiUrl = 'http://localhost:3002/api/';
const imgPath = `/assets/img/`;

export const environment = {
  production: false,
  defaultLanguage: 'en',
  api: `${apiUrl}`,
  api_security: `${apiUrl}auth/`,
  imgPath: imgPath,
  BUILD_TS: 0,
  FRONT_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im15b2VsNjgyNEBnbWFpbC5jb20iLCJmdWxsX25hbWUiOiJZb2VsIERhdmlkIiwiY2xpZW50IjoiYnJlZXplIiwic291cmNlIjoid2Vic2l0ZSJ9.1-CN9q1Swczf70gBAAnd5CRg_Jm60EdQJQe0iF7KPYw',
};
