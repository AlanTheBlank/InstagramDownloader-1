/****************************************************************************************
 * Copyright (c) 2020. HuiiBuh                                                          *
 * This file (decorators.ts) is part of InstagramDownloader which is released under     *
 * GNU LESSER GENERAL PUBLIC LICENSE.                                                   *
 * You are not allowed to use this code or this file for another project without        *
 * linking to the original source AND open sourcing your code.                          *
 ****************************************************************************************/

/****************************************************************************************
 * Inspiration for the error logging is from                                            *
 * https://github.com/sindresorhus/refined-github which is licensed under MIT           *
 *****************************************************************************************/

// tslint:disable:no-any
import { Alert } from './components/Alert';
import { Downloader } from './downloaders/Downloader';

export function singleton(constructor: any): any {
    return new Proxy(constructor, {
        construct(target: any, argArray: any, newTarget?: any): object {
            if (target.prototype !== newTarget.prototype) {
                return Reflect.construct(target, argArray, newTarget);
            }
            if (!target.SINGLETON_INSTANCE) {
                target.SINGLETON_INSTANCE = Reflect.construct(target, argArray, newTarget);
            }

            return target.SINGLETON_INSTANCE;
        },
    });
}

export function stopObservation(_: object,
                                __: string,
                                descriptor: PropertyDescriptor): void {

    const value = descriptor.value;
    descriptor.value = function(): void {
        Downloader.observer.disconnect();
        value.apply(this, arguments);
        Downloader.observer.observe();
    };

}

// tslint:disable-next-line:ban-types
export function LogClassErrors(constructor: Function): void {

    const reported: Record<string, boolean> = {};

    for (const key of Object.getOwnPropertyNames(constructor.prototype)) {
        const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, key) as PropertyDescriptor;
        const method = descriptor.value;
        if (!(method instanceof Function) || key === 'constructor') continue;
        descriptor.value = function(...args: any[]): void {
            try {
                return method.apply(this, args);
            } catch (e) {

                const issue = encodeURIComponent(`${constructor.name} ${e.toString()}`);
                if (reported[issue]) return;

                reported[issue] = true;
                Alert.add(`Instagram Downloader:\n ${constructor.name}-${e.toString()} \nLook in your browse console to see more details`, 'error');

                console.error(
                    `❌ Instagram Downloader → ${constructor.name} → \n`,
                    e.stack,
                    `\nSearch issue: https://github.com/huiibuh/InstagramDownloader/issues?q=is%3Aissue+${issue}`,
                    `\nOpen an issue: https://github.com/huiibuh/InstagramDownloader/issues/new?labels=bug&template=bug_report.md&title=${issue}`,
                );
            }
        };
        Object.defineProperty(constructor.prototype, key, descriptor);
    }
}
