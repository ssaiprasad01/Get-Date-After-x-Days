const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const filepath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const InitializeDbAndSever = async () => {
  try {
    database = await open({
      filename: filepath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running");
    });
  } catch (error) {
    console.log(`db Error:${error.message}`);
  }
};

InitializeDbAndSever();

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersDbQuery = `select player_id as playerId,player_name as playerName from player_details;`;
  const getPlayers = await database.all(getPlayersDbQuery);
  response.send(getPlayers);
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDbQuery = `select player_id as playerId,player_name as playerName from player_details where player_id=${playerId};`;
  const getPlayer = await database.get(getPlayerDbQuery);
  response.send(getPlayer);
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateDbQuery = `update player_details set player_name='${playerName}'`;
  const updatePlayer = await database.run(updateDbQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `select match_id as matchId,match,year from match_details where match_id=${matchId};`;
  const getMatchDetails = await database.get(getMatchDetailsQuery);
  response.send(getMatchDetails);
});

//API 5
const convertToCamelCase = (details) => {
  return {
    matchId: details.match_id,
    match: details.match,
    year: details.year,
  };
};

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsQuery = `select * from player_match_score natural join match_details where player_id=${playerId};`;
  const getMatchDetails = await database.all(getMatchDetailsQuery);
  response.send(
    getMatchDetails.map((eachMatch) => convertToCamelCase(eachMatch))
  );
});

//API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const matchId = request.params.matchId;
  const getPlayersListInAMatchQuery = `
    SELECT
    DISTINCT player_id,
    player_name
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;
  const getPlayersListInAMatch = await database.all(
    getPlayersListInAMatchQuery
  );
  const getPlayersListInAMatchResponse = getPlayersListInAMatch.map((item) => {
    return {
      playerId: item.player_id,
      playerName: item.player_name,
    };
  });
  response.send(getPlayersListInAMatchResponse);
});
//API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const playerId = request.params.playerId;
  const getTotalScoresOfAPlayerQuery = `
    SELECT
DISTINCT player_match_id,  
    player_name,
    sum(score) as total_score,
    sum(fours) as total_fours,
    sum(sixes) as total_sixes
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};
    `;
  const getTotalScoresOfAPlayer = await database.get(
    getTotalScoresOfAPlayerQuery
  );
  const getTotalScoresOfAPlayerResponse = {
    playerId: playerId,
    playerName: getTotalScoresOfAPlayer.player_name,
    totalScore: getTotalScoresOfAPlayer.total_score,
    totalSixes: getTotalScoresOfAPlayer.total_sixes,
    totalFours: getTotalScoresOfAPlayer.total_fours,
  };
  response.send(getTotalScoresOfAPlayerResponse);
});
module.exports = app;
