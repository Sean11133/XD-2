/** Label — Flyweight 共享實體。建立後透過 LabelFactory.getOrCreate() 凍結，嚴格不可變。*/
export class Label {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly color: string,
    public readonly description: string,
    public readonly createdAt: Date,
  ) {}
}
