import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class MessageEntity {
	@PrimaryGeneratedColumn("uuid")
		id: number;

	@Column()
		qqMessageID: string;

	@Column()
		discordMessageID: string;

	@Column({ nullable: true })
		from: "qq" | "discord";

	@Column({ name: "qqMessage", type: "varchar", nullable: true })
		_qqMessage: string;

	@Column({ name: "discordMessage", type: "varchar", nullable: true })
		_discordMessage: string;

	set qqMessage(msg: { content: string }) {
		this._qqMessage = JSON.stringify(msg);
	}

	get qqMessage(): {
		content: string;
		} {
		return JSON.parse(this._qqMessage);
	}

	set discordMessage(msg: {
		content: string;
		attachments: {
			url: string;
			name: string;
		};
	}) {
		this._discordMessage = JSON.stringify(msg);
	}

	get discordMessage(): {
		content: string;
		attachments: {
			url: string;
			name: string;
		};
		} {
		return JSON.parse(this._discordMessage);
	}
}
