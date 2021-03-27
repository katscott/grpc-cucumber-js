declare module 'interpolate' {
  interface InterpolateOptions {
    delimiter: string;
  }

  function interpolate(
    template: string,
    values: {
      [key: string]: never;
    },
    options: InterpolateOptions,
  ): string;

  export = interpolate;
}
