import { MessageEmbed } from "discord.js";
import { get_token, get_str_amount, get_main_color } from "../bot.js";
import ChartJSImage from 'chart.js-image';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs';

// Taked from https://convertingcolors.com/blog/article/convert_hex_to_rgb_with_javascript.html
String.prototype.convertToRGB = function(){
    var aRgbHex = this.match(/.{1,2}/g);
    var aRgb = [
        parseInt(aRgbHex[0], 16),
        parseInt(aRgbHex[1], 16),
        parseInt(aRgbHex[2], 16)
    ];
    return aRgb;
}

export class Token {
    constructor(id, client, db, config) {
        if (id == "coins") {
            id = "59bb9c6f-a67b-4759-bc25-3d3dcdb49d51";
        }
        for (let prop in db.getData(`/tokens/${id}`)) {
            this[prop] = db.getData(`/tokens/${id}/${prop}`);
        }
        this.id = id;
        this.author = client.users.fetch(this.data.creator);
        this.config = config;
        this.client = client;
        this.db = db;
        this.available = db.getData(`/users/0/wallet/${id}`);
    }

    async get_main_chart(color = get_main_color()) {
        let max_date = new Date();
        let min_date = new Date(max_date.getTime() - (1000 * 60 * 60 * 24 * 30));
        min_date.setHours(0, 0, 0, 0);
        max_date.setHours(23, 59, 59, 999);
        let datasets = [{
            label: `Cours du ${this.name.sing}`,
            borderColor: `rgba(${color.slice(1).convertToRGB()}, 1)`,
            backgroundColor: `rgba(${color.slice(1).convertToRGB()}, 0.2)`,
            data: [],
        }];
        for (let trade of this.get_trades(min_date.getTime(), max_date.getTime())) {
            datasets[0].data.push({
                x: trade.timestamp,
                y: trade.data.received.quantity / trade.data.sended.quantity
            });
        }
        let chart = await ChartJSImage().chart({
            type: 'line',
            data: {
                datasets: datasets
            },
            options: {
                legend: {
                    labels: {
                        fontColor: 'white'
                    }
                },
                scales: {
                    xAxes: [{
                        type: "time",
                        time: {
                            tooltipFormat: "DD-MM-YYYY"
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: "Date"
                        },
                        ticks: {
                            min: min_date.getTime(),
                            max: max_date.getTime(),
                        }
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'value'
                        }
                    }]
                }
            }
        }) // Line chart
            .backgroundColor("#2F3135") // Color of embed background
            .width(500) // 500px
            .height(300); // 300px
        
        let url_chart = await chart.toURL();
        if (url_chart.length < 2048) {
            return {
                link: url_chart,
                web: true
            };
        } else {
            let path = `./temporary_files/${uuidv4()}.png`;
            await chart.toFile(path);
            return {
                link: path,
                web: false
            };
        }
    }

    async get_main_message(color = get_main_color()) {
        let embed = new MessageEmbed()
            .setColor(color)
            .setTitle(`${this.name.sing}`)
            .addField("📉 COURS", `${get_str_amount(this.get_price(), "coins")}`)
            .addField("🧑‍💼 CRÉATEUR", `${(await this.author).username}`)
            .addField("🛒 EN VENTE", `${this.available}/${this.total_quantity}`)
        let chart = await this.get_main_chart(color);
        if (chart.web) {
            embed.setImage(chart.link);
            return { embeds: [embed] };
        } else {
            embed.setImage(`attachment://${chart.link.split("/").pop()}`);
            setTimeout(()=>{
                unlink(chart.link);
            }, 1000);
            return { embeds: [embed], components: [], files: [chart.link] };
        }
    }

    get_str_amount(amount) {
        return get_str_amount(amount, this.id);
    }

    get_price(trades = 10) {
        let sum = 0;
        let data = this.get_trades().sort((a, b) => a.timestamp - b.timestamp).slice(0, trades).map(t => t.data.received.quantity / t.data.sended.quantity);
        for (let t of data) {
            sum += t;
        }
        return sum / data.length;
    }

    get_trades(min_date = 0, max_date = Infinity) {
        return this.db.getData(`/events`).filter(e => e.type == "trade" && e.data.sended.token == this.id && min_date < e.timestamp < max_date);
    }
}