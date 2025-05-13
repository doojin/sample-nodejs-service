import datasource from './datasource';

(async () => {
  await datasource.initialize();
  await datasource.runMigrations();
  await datasource.destroy();
})();
