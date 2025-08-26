import { compare, hash } from "bcrypt"

interface GenerateHashParams {
    plaintext: string
    saltRound?: number
}

interface CompareHashParams {
    plaintext: string
    hashValue: string 
}

export const generateHash = async ({
    plaintext,
    saltRound = 12,
}: GenerateHashParams): Promise<string> => {
    return hash(plaintext, saltRound)
}

export const compareHash = async ({
    plaintext,
    hashValue,
}: CompareHashParams): Promise<boolean> => {
    return compare(plaintext, hashValue)
}
