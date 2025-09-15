import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {v4 as  uuid } from 'uuid'
import { storageEnum } from './cloud.multer'
import { createReadStream } from 'node:fs'
import { BadRequestException } from '../response/error.response'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3Config = () => {
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId:process.env.ACCESS_KEY_ID as string ,
            secretAccessKey:process.env.SECRET_ACCESS_KEY as string
        }
    })
}

export const uploadFile = async ({
    storageApproach = storageEnum.memory,
    Bucket=process.env.AWS_BUCKET_NAME as string,
    path='general' ,
    ACL='private',
    file
}:
{storageApproach?:storageEnum,
    Bucket?:string,
    path?:string,
    ACL?: ObjectCannedACL,
    file:Express.Multer.File}): Promise<string>=> {
    const command = new PutObjectCommand({
        Bucket ,
        Key:`${process.env.APPLICATION_NAME}/${path}/${uuid()}_${file.originalname}`,
        ACL,
        Body:storageApproach === storageEnum.memory? file.buffer: createReadStream(file.path),
        ContentType:file.mimetype
    })
    const s3=s3Config()
    await s3.send(command)
    if (!command.input?.Key) {
        throw new BadRequestException('fail to generate upload key')
    }
        return command.input.Key
}

export const uploadFiles = async ({
    storageApproach = storageEnum.memory,
    Bucket=process.env.AWS_BUCKET_NAME as string,
    path='general' ,
    ACL='private',
    files,
    useLarge=false
}:
{storageApproach?:storageEnum,
    Bucket?:string,
    path?:string,
    ACL?: ObjectCannedACL,
    files: Express.Multer.File[],
    useLarge?:boolean
    }):Promise<string[]> => {
    let urls: string[] = []
    if (useLarge) {
        urls = await Promise.all(files.map(file => {
            return uploadLargeFile({
        storageApproach ,
        Bucket,
        path,
        ACL,
        file
        })
            
        }))
        return urls 
    } else {
        urls = await Promise.all(files.map(file => {
            return uploadFile({
        storageApproach ,
        Bucket,
        path,
        ACL,
        file
        })
            
        }))
        return urls 
    }

}
export const uploadLargeFile = async ({
    storageApproach = storageEnum.disk,
    Bucket=process.env.AWS_BUCKET_NAME,
    path='general' ,
    ACL='private',
    file
}:
{storageApproach?:storageEnum,
    Bucket?:string,
    path?:string,
    ACL?: ObjectCannedACL,
    file:Express.Multer.File}):Promise<string> =>{

    const upload = new Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_${file.originalname}`,
            Body: 
                storageApproach === storageEnum.memory ? file.buffer : createReadStream(file.path),
            ContentType:file.mimetype
        },
        partSize: 5* 1024 *1024 
        

    })
    upload.on('httpUploadProgress', (Progress) => {
        console.log('upload file progress is:: ',Progress);
        
    })
    const { Key } = await upload.done()
    if (!Key) {
        throw new BadRequestException('fail to upload key')
    }
        return Key
    
}

export const createPreSignUploadUrl = async ({
    Bucket=process.env.AWS_BUCKET_NAME as string,
    path='general',
    ContentType,
    originalname,
    expiresIn=Number(process.env.AWS_PRE_SIGN_URL_EXPIRES_IN)
}: {
    Bucket?:string,
    path?:string
    ContentType: string,
    originalname: string,
    expiresIn?:number
}):Promise<{url: string ,Key:string}> => {
    const command = new PutObjectCommand({
        Bucket,
        Key:`${process.env.APPLICATION_NAME}/${path}/${uuid()}_${originalname}`,

        ContentType
    })
    
    const url = await getSignedUrl(s3Config(), command, { expiresIn: 60 })
    if (!url || ! command.input.Key) {
        throw new BadRequestException('fail to generate presigned url')
    }
    return {url , Key:command.input.Key}
}


export const createGetPreSignUploadUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,
    expiresIn = Number(process.env.AWS_PRE_SIGN_URL_EXPIRES_IN),
    downloadName='dummy',
    download='false'
}: {
    Bucket?: string;
    Key: string;
    expiresIn?: number,
    downloadName?: string,
    download?:string
}): Promise<string> => {
    if (!Key) {
    throw new BadRequestException("Key is required");
    }
    
    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download ===
            'true' ?
            `attachment; filename="${downloadName || Key.split("/").pop()}"`
            : undefined
    });
    const url = await getSignedUrl(s3Config(), command, { expiresIn });

    return url;
};

export const getFile =async ({
    Bucket=process.env.AWS_BUCKET_NAME,
    Key
    }:{
    Bucket?:string,
    Key:string
    }):Promise<GetObjectCommandOutput> => {
    const command = new GetObjectCommand({
        Bucket,
        Key
    })
    return await s3Config().send(command)
}

export const deleteFile =async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    Key
}:
    {
        Bucket?: string,
        Key: string
    }):Promise<DeleteObjectCommandOutput>=> {
    const command = new DeleteObjectCommand({ 
        Bucket,
        Key
    })
    return await s3Config().send(command)
}
export const DeleteFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    urls,
    Quiet=false
    
    
}: {
        Bucket?: string,
        urls:string[],
        Quiet?:boolean
    }):Promise<DeleteObjectsCommandOutput> => {
    const Objects = urls.map(url => {
        return{Key:url}
    })
    console.log(Objects);
    
    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    })
    return s3Config().send(command)
}

export const deleteListFolderByPrefix =async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path,
    Quiet=false
}:{ Bucket?:string,
        path: string,
        Quiet?:boolean
}):Promise<DeleteObjectsCommandOutput> => {
    const fileList = await listDirectoryFiles({
        Bucket , path
    })
        if (!fileList?.Contents?.length) {
            throw new BadRequestException('empty directory')
        }
        const urls:string[] = fileList.Contents?.map(file => {
            return file.Key as string
        })
        return  await DeleteFiles({urls})
    
}

export const listDirectoryFiles =async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path
}:{ Bucket?:string,
    path:string
}) => {
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix:`${process.env.APPLICATION_NAME}/${path}`
    })
    return s3Config().send(command)
}











/*export const uploadLargeFiles = async ({
    storageApproach = storageEnum.disk,
    Bucket=process.env.AWS_BUCKET_NAME as string,
    path='general' ,
    ACL='private',
    files
}:
{storageApproach?:storageEnum,
    Bucket?:string,
    path?:string,
    ACL?: ObjectCannedACL,
    files: Express.Multer.File[]
    }):Promise<string[]> => {
    let urls: string[] = []
    urls = await Promise.all(files.map(file => {
        return uploadLargeFile({
        storageApproach ,
        Bucket,
        path,
        ACL,
        file
        })
            
        }))
        return urls    
}*/
