import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { Eta } from "https://deno.land/x/eta@v3.5.0/src/index.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

const eta = new Eta({
    views: "./views",
    varName: "data",
});
const game = new Eta({
    views: "./game",
    varName: "data",
});


let sqldb = new DB("words.db");

Deno.serve(async (request) => {
    const headers = new Headers();
    headers.set("content-type", "text/html; charset=utf-8");

    const formData = request.method == "POST"
        ? await request.formData()
        : new FormData();

    const url = new URL(request.url);
    if (url.pathname == "egon") {
        sqldb = new DB("words2.db");
    }
    if (url.pathname == "viktor") {
        sqldb = new DB("words3.db");
    }

    switch (url.pathname) {
        case "/": {
            if (formData.has("insert")) {
                const word = formData.get("word") as string;

                sqldb.query("INSERT INTO word (word) VALUES (?)", [
                    word,
                ]);
            }
            if (formData.has("remove")) {
                const word = formData.get("word") as string

                sqldb.query("DELETE FROM word WHERE word = (?)", [
                    word
                ]);
            }

            const words = sqldb.query(
                "SELECT * FROM word",
            );

            if (formData.has("spela")) {
                const players = +(formData.get("spelare") as string);

                const secretword = sqldb.query(
                    "SELECT word FROM word ORDER BY RANDOM() LIMIT 1",
                );

                sqldb.query("DELETE FROM players;");

                const imposter = Math.floor(Math.random() * players);
                const startingplayer = Math.floor(Math.random() * players + 1);

                for (let index = 0; index < players; index++) {
                    if (index != imposter) {
                        sqldb.query("INSERT INTO players VALUES (?, ?)", [
                            index,
                            String(secretword[0]),
                        ]);
                    } else {
                        sqldb.query(
                            "INSERT INTO players VALUES (?, 'Imposter ')",
                            [
                                index,
                            ],
                        );
                    }
                }

                const spelarord = sqldb.query(
                    "SELECT * FROM players",
                )
                // const startingplayer = Math.floor(Math.random() * players);
                return new Response(
                    game.render("index.eta", { words, secretword, players, spelarord, startingplayer }),
                    {
                        headers,
                    },
                );

            } else {
                return new Response(eta.render("index.eta", { words }), {
                    headers,
                });
            }
        }
    }

    return serveDir(request, {
        fsRoot: "public",
    });
});