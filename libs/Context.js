import { MessageActionRow, MessageButton } from "discord.js";

export class Context {
    constructor(config, db, client) {
        this.config = config;
        this.db = db;
        this.client = client;
        this.history = [];
    }

    async new_page(interaction, msg_data) {
        this.history.push(msg_data);
        if (this.history.length == 1) {
            await interaction.update(msg_data);
            return this;
        }
        msg_data.components += new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setCustomId("back")
                    .setLabel("Retour")
                    .setEmoji("◀️")
                    .setStyle("SECONDARY")
            ]);
        await interaction.update(msg_data);
        let back_listener = async back_interaction => {
            if (!back_interaction.isButton()) return;
            if (back_interaction.message.id != interaction.message.id) return;
            if (back_interaction.customId != "back") return;
            await this.go_back(back_interaction);
        }
        this.client.once("interactionCreate", back_listener);
        setTimeout(() => {
            this.client.removeListener("interactionCreate", back_listener);
        }, 60000);
        return this;
    }

    async go_back(interaction) {
        this.history.pop();
        await this.new_page(interaction, this.history.pop());
        return this;
    }
}