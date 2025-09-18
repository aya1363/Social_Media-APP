import EventEmitter from 'node:events';
import { deleteFile, getFile } from './s3.config';
import { userModel } from '../../DB/models/user.model';
import { UserRepository } from '../../DB/DBRepository/user.repository';
export const s3Event = new EventEmitter()

s3Event.on('trackProfileImageUpload', (data) => {

    // console.log({ data });
    setTimeout(async () => {
        const UserModel = new UserRepository(userModel)
        try {
            await getFile({ Key: data.Key })
            // console.log({ data });
            await UserModel.updateOne({
                filter: {_id:data.userId},
                update: {
                    $unset:{temporaryProfilePicture:1}
                }
            })
            await deleteFile({ Key:data.oldKey})
            console.log('Done 🎉');   
        } catch (error:any) {
           // console.log({ error });
            if (error.code === 'NoSuchKey') {
                await UserModel.updateOne({
                    filter: {_id:data.userId},
                    update: {
                        profilePicture:data.oldKey,
                        $unset:{temporaryProfilePicture:1}
                    }
                })
            }
        }

}, data.expiresIn || Number(process.env.AWS_PRE_SIGN_URL_EXPIRES_IN)*1000 );
    
})