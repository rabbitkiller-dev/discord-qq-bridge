import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";

@Entity()
export class DToQUserLimitEntity {
    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column()
    guild: string;

    @Column()
    channel: string;

    @Column()
    user: string;

    @CreateDateColumn()
    createDate: Date;
}
    
