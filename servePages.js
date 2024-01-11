import fs from 'fs';

let servePage = (data) => {
    try {
        const file = fs.readFileSync(data);
        return file;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export { servePage };