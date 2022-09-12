# ******************************* #
# DB.py
# Database connections for bot
# ******************************* #

import aiomysql
import yaml

from os.path import abspath

# General Variables #
with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)


async def connect():
    DBConn = await aiomysql.create_pool(host=config['DBServer'], port=3306, user=config['DBUser'], password=config['DBPass'], db=config['DBName'])
    return DBConn


async def select_one(query, pool):
    async with pool.acquire() as DBConn:
        async with DBConn.cursor() as cur:
            await cur.execute(query)
            result = await cur.fetchone()
    return result


async def select_all(query, pool):
    async with pool.acquire() as DBConn:
        async with DBConn.cursor() as cur:
            await cur.execute(query)
            result = await cur.fetchall()
    return result


async def execute(query, pool):
    async with pool.acquire() as DBConn:
        async with DBConn.cursor() as cur:
            await cur.execute(query)
            await DBConn.commit()


def close(DBConn):
    DBConn.close()
