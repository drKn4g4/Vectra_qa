import { format } from 'date-fns';

class Logger {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    private log(level: string, message: string): void {
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        console.log(`[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`);
    }

    info(message: string): void {
        this.log('info', message);
    }

    warn(message: string): void {
        this.log('warn', message);
    }

    error(message: string): void {
        this.log('error', message);
    }
}

export default Logger; 