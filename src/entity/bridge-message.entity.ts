import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
// import { SingleMessage } from "../el-bot/interface";

@Entity()
export class BridgeMessageEntity {
	@PrimaryGeneratedColumn("uuid")
		id: number;

	@Column({ nullable: true })
		qqMessageID: string;

	@Column({ nullable: true })
		dcMessageID: string;

	@Column({ nullable: true })
		khlMessageID: string;

	@Column()
		from: "QQ" | "KHL" | "DC";

	// @Column({type: 'json'})
	// 	dcMessageContent: SingleMessage[] = [];
	//
	// @Column({type: 'json'})
	// 	qqMessageContent: SingleMessage[] = [];
	//
	// @Column({type: 'json'})
	// 	khlMessageContent: SingleMessage[] = [];
}
