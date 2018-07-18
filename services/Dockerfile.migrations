FROM jenkinsciinfra/evergreen-backend:latest

ENV PATH ./node_modules/.bin:$PATH

COPY .sequelizerc .

CMD sh -c 'sequelize db:migrate && sequelize db:seed:all'
