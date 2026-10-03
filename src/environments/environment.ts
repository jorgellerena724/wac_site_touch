const apiUrl = 'http://localhost:3002/api/';
const imgPath = `/assets/img/uploads/`;
const staticImgPath = `/assets/img/`;

export const environment = {
  production: false,
  defaultLanguage: 'es',
  api: `${apiUrl}`,
  api_security: `${apiUrl}auth/`,
  imgPath: imgPath,
  staticImgPath: staticImgPath,
  BUILD_TS: 0,
  FRONT_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJlZWZkbWNAc2hpcmthc29mdC5jb20iLCJmdWxsX25hbWUiOiJSZWVmIERNQyIsImNsaWVudCI6InJlZWZfZG1jIiwic291cmNlIjoid2Vic2l0ZSJ9.E0Fng2cCyslBndaqh8uMtH0tP33uQyDgnN7CaxXFJMw',
};
