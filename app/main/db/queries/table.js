const { r } = require('rebirthdb-ts')
const driver = require('../driver')
const { SYSTEM_DB } = require('../../helpers/constants')

const connection = () => driver.getConnection()

const tablesByDb = () => {
  return r
    .db(SYSTEM_DB)
    .table('db_config')
    .filter(db => db('name').ne(SYSTEM_DB))
    .map(db => ({
      name: db('name'),
      id: db('id'),
      tables: r
        .db(SYSTEM_DB)
        .table('table_status')
        .orderBy(table => table('name'))
        .filter({ db: db('name') })
        .merge(table => ({
          shards: table('shards')
            .count()
            .default(0),
          replicas: table('shards')
            .default([])
            .map(shard => shard('replicas').count())
            .sum(),
          replicasReady: table('shards')
            .default([])
            .map(shard =>
              shard('replicas')
                .filter(replica => replica('state').eq('ready'))
                .count()
            )
            .sum(),
          status: table('status'),
          id: table('id')
        }))
    })).run(connection())
}

module.exports = {
  tablesByDb
}
