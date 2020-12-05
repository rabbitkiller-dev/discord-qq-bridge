import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    qqMessageID: string;

    @Column()
    discordMessageID: string;
}