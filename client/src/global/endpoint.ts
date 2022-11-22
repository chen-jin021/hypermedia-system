const devEndpoint = 'http://localhost:5001/' // change this to 5000 if needed

// TODO [Deployment]: change this to your heroku app url
const prodEndpoint = 'https://thawing-island-15534.herokuapp.com/'

export const endpoint = process.env.NODE_ENV === 'production' ? prodEndpoint : devEndpoint
