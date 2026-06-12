const apiUrl = 'http://localhost:3002/api/';
const imgPath = `/assets/img/`;

export const environment = {
  production: false,
  defaultLanguage: 'en',
  api: `${apiUrl}`,
  api_security: `${apiUrl}auth/`,
  imgPath: imgPath,
  BUILD_TS: 0,
  /*FRONT_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImxpYW5hLmxvcmVuem9AdG91Y2hhbmRib29rLmNvbSIsImZ1bGxfbmFtZSI6IlRvdWNoIFJlZWYiLCJjbGllbnQiOiJ0b3VjaF9yZWVmIn0.t9Nz0jcETCBE8ZMWESdoYFDwRPMaI_zUiuui4DeE2Hg',
*/
  FRONT_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRvdWNocmVlZkBzaGlya2Fzb2Z0LmNvbSIsImZ1bGxfbmFtZSI6IlRvdWNoIFJlZWYiLCJjbGllbnQiOiJ0b3VjaF9yZWVmIn0.6kFdlePwmPaRPPot6jRs72U1yRtFxO2mBXbhwVwhe4E',
};
