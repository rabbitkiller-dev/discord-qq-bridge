import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class BridgeMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  qqMessageID: string;

  @Column()
  dcMessageID: string;

  @Column()
  khlMessageID: string;

  @Column()
  from: 'QQ' | 'KHL' | 'DC';

}
